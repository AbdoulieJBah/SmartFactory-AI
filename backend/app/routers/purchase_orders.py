from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Product, PurchaseOrder, Supplier, User
from schemas import PurchaseOrderCreate, PurchaseOrderResponse

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Purchase Orders",
            description=description,
        )
    )


@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    order: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == order.supplier_id, Supplier.company_id == company.id)
        .first()
    )

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    product = (
        db.query(Product)
        .filter(Product.id == order.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_order = PurchaseOrder(**order.dict(), company_id=company.id)

    db.add(new_order)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created purchase order ID {new_order.id}",
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/", response_model=list[PurchaseOrderResponse])
def get_purchase_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.company_id == company.id)
        .order_by(PurchaseOrder.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == order_id, PurchaseOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    return order


@router.put("/{order_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    order_id: int,
    order_update: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == order_id, PurchaseOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == order_update.supplier_id, Supplier.company_id == company.id)
        .first()
    )

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    product = (
        db.query(Product)
        .filter(Product.id == order_update.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in order_update.dict().items():
        setattr(order, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated purchase order ID {order_id}",
    )

    db.commit()
    db.refresh(order)

    return order


@router.delete("/{order_id}")
def delete_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == order_id, PurchaseOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    db.delete(order)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted purchase order ID {order_id}",
    )

    db.commit()

    return {"message": "Purchase order deleted successfully"}