from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, MaintenanceWorkOrder, User, WorkCenter
from schemas import MaintenanceCreate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Maintenance",
            description=description,
        )
    )


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_order(
    order: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Maintenance Engineer"])
    ),
    company: Company = Depends(get_current_company),
):
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

    new_order = MaintenanceWorkOrder(**order.dict(), company_id=company.id)

    db.add(new_order)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created maintenance order ID {new_order.id}",
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(MaintenanceWorkOrder)
        .filter(MaintenanceWorkOrder.company_id == company.id)
        .order_by(MaintenanceWorkOrder.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=MaintenanceResponse)
def get_maintenance_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(MaintenanceWorkOrder)
        .filter(
            MaintenanceWorkOrder.id == order_id,
            MaintenanceWorkOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Maintenance order not found")

    return order


@router.put("/{order_id}", response_model=MaintenanceResponse)
def update_maintenance_order(
    order_id: int,
    order_update: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Maintenance Engineer"])
    ),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(MaintenanceWorkOrder)
        .filter(
            MaintenanceWorkOrder.id == order_id,
            MaintenanceWorkOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Maintenance order not found")

    work_center = (
        db.query(WorkCenter)
        .filter(
            WorkCenter.id == order_update.work_center_id,
            WorkCenter.company_id == company.id,
        )
        .first()
    )

    if not work_center:
        raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in order_update.dict().items():
        setattr(order, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated maintenance order ID {order_id}",
    )

    db.commit()
    db.refresh(order)

    return order


@router.delete("/{order_id}")
def delete_maintenance_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(MaintenanceWorkOrder)
        .filter(
            MaintenanceWorkOrder.id == order_id,
            MaintenanceWorkOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Maintenance order not found")

    db.delete(order)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted maintenance order ID {order_id}",
    )

    db.commit()

    return {"message": "Maintenance order deleted successfully"}