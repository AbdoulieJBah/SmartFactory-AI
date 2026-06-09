from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    require_read_access,
)
from models import (
    Company,
    Inventory,
    Product,
    ProductionOrder,
    PurchaseOrder,
    QualityCheck,
    SalesOrder,
    User,
    WasteRecord,
    DowntimeRecord,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/executive")
def executive_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    company_id = company.id

    products = (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .count()
    )

    inventory_value = (
        db.query(
            func.sum(
                Inventory.quantity * Product.cost_price
            )
        )
        .join(
            Product,
            Inventory.product_id == Product.id
        )
        .filter(
            Inventory.company_id == company_id
        )
        .scalar()
    ) or 0

    production_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id
        )
        .count()
    )

    sales_value = (
        db.query(
            func.sum(
                SalesOrder.quantity *
                SalesOrder.unit_price
            )
        )
        .filter(
            SalesOrder.company_id == company_id
        )
        .scalar()
    ) or 0

    purchase_value = (
        db.query(
            func.sum(
                PurchaseOrder.quantity *
                PurchaseOrder.unit_price
            )
        )
        .filter(
            PurchaseOrder.company_id == company_id
        )
        .scalar()
    ) or 0

    waste_units = (
        db.query(
            func.sum(WasteRecord.quantity)
        )
        .filter(
            WasteRecord.company_id == company_id
        )
        .scalar()
    ) or 0

    downtime_minutes = (
        db.query(
            func.sum(
                DowntimeRecord.duration_minutes
            )
        )
        .filter(
            DowntimeRecord.company_id == company_id
        )
        .scalar()
    ) or 0

    quality_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id
        )
        .count()
    )

    failed_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail"
        )
        .count()
    )

    return {
        "company": {
            "id": company.id,
            "name": company.name,
        },
        "summary": {
            "products": products,
            "inventory_value": round(inventory_value, 2),
            "production_orders": production_orders,
            "sales_value": round(sales_value, 2),
            "purchase_value": round(purchase_value, 2),
            "waste_units": round(waste_units, 2),
            "downtime_minutes": round(downtime_minutes, 2),
            "quality_checks": quality_checks,
            "failed_checks": failed_checks,
        },
    }
