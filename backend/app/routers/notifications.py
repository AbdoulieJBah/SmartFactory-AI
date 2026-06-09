from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_company, get_current_user
from models import Company, Inventory, Product, ProductionOrder, QualityCheck, User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    company_id = company.id
    notifications = []

    low_stock = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.company_id == company_id,
            Product.company_id == company_id,
            Inventory.quantity <= Inventory.min_stock,
        )
        .limit(10)
        .all()
    )

    for item in low_stock:
        notifications.append({
            "title": "Low Stock Alert",
            "message": f"{item.product.name} is below minimum stock. Current: {item.quantity}, Minimum: {item.min_stock}.",
            "type": "Inventory",
            "severity": "High",
        })

    active_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status.in_(["Planned", "Released", "In Progress"]),
        )
        .limit(10)
        .all()
    )

    for order in active_orders:
        notifications.append({
            "title": "Production Order Active",
            "message": f"{order.order_number} is currently {order.status}.",
            "type": "Production",
            "severity": "Medium",
        })

    failed_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail",
        )
        .limit(10)
        .all()
    )

    for check in failed_checks:
        notifications.append({
            "title": "Quality Failure",
            "message": f"Quality check {check.id} failed. Action: {check.corrective_action or 'Not specified'}.",
            "type": "Quality",
            "severity": "High",
        })

    return notifications