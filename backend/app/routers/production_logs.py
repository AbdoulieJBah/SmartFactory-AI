from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    get_current_user,
    require_production_access,
    require_read_access,
)
from models import AuditLog, Company, ProductionLog, ProductionOrder, User
from schemas import ProductionLogCreate, ProductionLogResponse

router = APIRouter(
    prefix="/production-logs",
    tags=["Production Logs"],
    dependencies=[Depends(get_current_user)],
)


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Production Logs",
            description=description,
        )
    )


@router.post("/", response_model=ProductionLogResponse, status_code=status.HTTP_201_CREATED)
def create_production_log(
    log: ProductionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    if log.quantity_produced <= 0:
        raise HTTPException(status_code=400, detail="Quantity produced must be greater than zero")

    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == log.production_order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    remaining_quantity = float(order.target_quantity or 0) - float(order.produced_quantity or 0)

    if log.quantity_produced > remaining_quantity:
        raise HTTPException(
            status_code=400,
            detail="Quantity produced cannot exceed the production order remaining quantity",
        )

    new_log = ProductionLog(**log.dict(), company_id=company.id)

    order.produced_quantity = (order.produced_quantity or 0) + log.quantity_produced

    if order.produced_quantity >= order.target_quantity:
        order.status = "Completed"
    elif order.produced_quantity > 0:
        order.status = "In Progress"

    db.add(new_log)
    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Recorded {log.quantity_produced} units against production order {order.order_number}",
    )
    db.commit()
    db.refresh(new_log)

    return new_log


@router.get("/", response_model=list[ProductionLogResponse])
def get_production_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(ProductionLog)
        .filter(ProductionLog.company_id == company.id)
        .order_by(ProductionLog.id.desc())
        .all()
    )


@router.get("/{log_id}", response_model=ProductionLogResponse)
def get_production_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    log = (
        db.query(ProductionLog)
        .filter(ProductionLog.id == log_id, ProductionLog.company_id == company.id)
        .first()
    )

    if not log:
        raise HTTPException(status_code=404, detail="Production log not found")

    return log


@router.delete("/{log_id}")
def delete_production_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    log = (
        db.query(ProductionLog)
        .filter(ProductionLog.id == log_id, ProductionLog.company_id == company.id)
        .first()
    )

    if not log:
        raise HTTPException(status_code=404, detail="Production log not found")

    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == log.production_order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if order:
        order.produced_quantity = max(
            0,
            (order.produced_quantity or 0) - log.quantity_produced
        )

        if order.produced_quantity == 0:
            order.status = "Planned"
        elif order.produced_quantity < order.target_quantity:
            order.status = "In Progress"

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted production log ID {log_id}",
    )

    db.delete(log)
    db.commit()

    return {"message": "Production log deleted successfully"}
