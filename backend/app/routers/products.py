from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Product, User
from schemas import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Products",
            description=description,
        )
    )


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    existing_product = (
        db.query(Product)
        .filter(Product.sku == product.sku, Product.company_id == company.id)
        .first()
    )

    if existing_product:
        raise HTTPException(status_code=400, detail="A product with this SKU already exists")

    new_product = Product(**product.dict(), company_id=company.id)

    try:
        db.add(new_product)
        db.flush()

        write_audit_log(
            db,
            current_user,
            "CREATE",
            f"Created product {new_product.name} with SKU {new_product.sku}",
        )

        db.commit()
        db.refresh(new_product)
        return new_product

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Product creation failed")


@router.get("/", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(Product)
        .filter(Product.company_id == company.id)
        .order_by(Product.id.desc())
        .all()
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_name = product.name

    for key, value in product_update.dict().items():
        setattr(product, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated product {old_name} with ID {product_id}",
    )

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_name = product.name
    db.delete(product)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted product {product_name} with ID {product_id}",
    )

    db.commit()

    return {"message": "Product deleted successfully"}