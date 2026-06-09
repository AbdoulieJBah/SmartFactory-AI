from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    require_inventory_access,
    require_read_access,
)
from models import AuditLog, Company, Inventory, Product, User
from schemas import InventoryCreate, InventoryResponse

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Inventory",
            description=description,
        )
    )


@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    item: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_access),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == item.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_item = Inventory(**item.dict(), company_id=company.id)

    db.add(new_item)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created inventory record for product ID {item.product_id}",
    )

    db.commit()
    db.refresh(new_item)

    return new_item


@router.get("/", response_model=list[InventoryResponse])
def get_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(Inventory)
        .filter(Inventory.company_id == company.id)
        .order_by(Inventory.id.desc())
        .all()
    )


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    item = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id, Inventory.company_id == company.id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    return item


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: int,
    item_update: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_access),
    company: Company = Depends(get_current_company),
):
    item = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id, Inventory.company_id == company.id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    product = (
        db.query(Product)
        .filter(Product.id == item_update.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in item_update.dict().items():
        setattr(item, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated inventory record ID {inventory_id}",
    )

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{inventory_id}")
def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_access),
    company: Company = Depends(get_current_company),
):
    item = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id, Inventory.company_id == company.id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db.delete(item)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted inventory record ID {inventory_id}",
    )

    db.commit()

    return {"message": "Inventory item deleted successfully"}