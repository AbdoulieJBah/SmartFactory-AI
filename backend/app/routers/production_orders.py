from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    require_production_access,
    require_read_access,
)
from models import AuditLog, Company, Product, ProductionOrder, User, WorkCenter
from schemas import ProductionOrderCreate, ProductionOrderResponse

router = APIRouter(prefix="/production-orders", tags=["Production Orders"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Production Orders",
            description=description,
        )
    )


@router.post("/", response_model=ProductionOrderResponse, status_code=status.HTTP_201_CREATED)
def create_production_order(
    order: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == order.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if order.work_center_id:
        work_center = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == order.work_center_id,
                WorkCenter.company_id == company.id,
            )
            .first()
        )

        if not work_center:
            raise HTTPException(status_code=404, detail="Work center not found")

    existing_order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.order_number == order.order_number,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if existing_order:
        raise HTTPException(status_code=400, detail="Production order number already exists")

    new_order = ProductionOrder(**order.dict(), company_id=company.id)

    db.add(new_order)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created production order {new_order.order_number}",
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/", response_model=list[ProductionOrderResponse])
def get_production_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(ProductionOrder)
        .filter(ProductionOrder.company_id == company.id)
        .order_by(ProductionOrder.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=ProductionOrderResponse)
def get_production_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    return order


@router.put("/{order_id}", response_model=ProductionOrderResponse)
def update_production_order(
    order_id: int,
    order_update: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    for key, value in order_update.dict().items():
        setattr(order, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated production order {order.order_number}",
    )

    db.commit()
    db.refresh(order)

    return order


@router.delete("/{order_id}")
def delete_production_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    order_number = order.order_number

    db.delete(order)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted production order {order_number}",
    )

    db.commit()

    return {"message": "Production order deleted successfully"}