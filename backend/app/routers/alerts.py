from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_company, get_current_user
from models import Company, Inventory, Product, ProductionOrder, QualityCheck, User

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    company_id = company.id
    alerts = []

    low_stock = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.company_id == company_id,
            Product.company_id == company_id,
            Inventory.quantity <= Inventory.min_stock,
        )
        .all()
    )

    for item in low_stock:
        alerts.append({
            "type": "Low Stock",
            "severity": "High",
            "message": f"{item.product.name} stock is {item.quantity}, minimum is {item.min_stock}.",
        })

    active_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status.in_(["Planned", "Released", "In Progress"]),
        )
        .all()
    )

    for order in active_orders:
        completion = (
            (order.produced_quantity / order.target_quantity) * 100
            if order.target_quantity > 0
            else 0
        )

        severity = "High" if order.priority == "High" and completion < 50 else "Medium"

        alerts.append({
            "type": "Production",
            "severity": severity,
            "message": f"Order {order.order_number} is {round(completion, 2)}% complete and status is {order.status}.",
        })

    failed_quality = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail",
        )
        .all()
    )

    for qc in failed_quality:
        alerts.append({
            "type": "Quality",
            "severity": "High",
            "message": f"Failed quality check {qc.id}. Corrective action: {qc.corrective_action or 'Not specified'}.",
        })

    return alerts