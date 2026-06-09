from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_company, get_current_user
from models import (
    Company,
    Customer,
    DowntimeRecord,
    Inventory,
    Product,
    ProductionOrder,
    PurchaseOrder,
    QualityCheck,
    SalesOrder,
    Supplier,
    User,
    WasteRecord,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def executive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    company_id = company.id

    total_products = db.query(Product).filter(Product.company_id == company_id).count()
    total_suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).count()
    total_customers = db.query(Customer).filter(Customer.company_id == company_id).count()

    total_inventory_units = (
        db.query(func.sum(Inventory.quantity))
        .filter(Inventory.company_id == company_id)
        .scalar()
    ) or 0

    inventory_value = (
        db.query(func.sum(Inventory.quantity * Product.cost_price))
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.company_id == company_id, Product.company_id == company_id)
        .scalar()
    ) or 0

    open_production_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status != "Completed",
        )
        .count()
    )

    completed_production_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status == "Completed",
        )
        .count()
    )

    total_target_quantity = (
        db.query(func.sum(ProductionOrder.target_quantity))
        .filter(ProductionOrder.company_id == company_id)
        .scalar()
    ) or 0

    total_produced_quantity = (
        db.query(func.sum(ProductionOrder.produced_quantity))
        .filter(ProductionOrder.company_id == company_id)
        .scalar()
    ) or 0

    production_efficiency = (
        (total_produced_quantity / total_target_quantity) * 100
        if total_target_quantity > 0
        else 0
    )

    total_waste = (
        db.query(func.sum(WasteRecord.quantity))
        .filter(WasteRecord.company_id == company_id)
        .scalar()
    ) or 0

    waste_rate = (
        (total_waste / (total_produced_quantity + total_waste)) * 100
        if (total_produced_quantity + total_waste) > 0
        else 0
    )

    downtime_minutes = (
        db.query(func.sum(DowntimeRecord.duration_minutes))
        .filter(DowntimeRecord.company_id == company_id)
        .scalar()
    ) or 0

    downtime_hours = downtime_minutes / 60

    total_quality_checks = (
        db.query(QualityCheck)
        .filter(QualityCheck.company_id == company_id)
        .count()
    )

    failed_quality_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail",
        )
        .count()
    )

    quality_pass_rate = (
        ((total_quality_checks - failed_quality_checks) / total_quality_checks) * 100
        if total_quality_checks > 0
        else 100
    )

    total_sales_revenue = (
        db.query(func.sum(SalesOrder.quantity * SalesOrder.unit_price))
        .filter(SalesOrder.company_id == company_id)
        .scalar()
    ) or 0

    total_purchase_value = (
        db.query(func.sum(PurchaseOrder.quantity * PurchaseOrder.unit_price))
        .filter(PurchaseOrder.company_id == company_id)
        .scalar()
    ) or 0

    active_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status.in_(["Planned", "Released", "In Progress"]),
        )
        .count()
    )

    low_stock_items = (
        db.query(Inventory)
        .filter(
            Inventory.company_id == company_id,
            Inventory.quantity <= Inventory.min_stock,
        )
        .count()
    )

    return {
        "company": {
            "id": company.id,
            "name": company.name,
        },
        "kpis": {
            "total_products": total_products,
            "total_suppliers": total_suppliers,
            "total_customers": total_customers,
            "total_inventory_units": round(total_inventory_units, 2),
            "inventory_value": round(inventory_value, 2),
            "open_production_orders": open_production_orders,
            "completed_production_orders": completed_production_orders,
            "active_orders": active_orders,
            "production_efficiency": round(production_efficiency, 2),
            "waste_rate": round(waste_rate, 2),
            "downtime_hours": round(downtime_hours, 2),
            "quality_pass_rate": round(quality_pass_rate, 2),
            "total_sales_revenue": round(total_sales_revenue, 2),
            "total_purchase_value": round(total_purchase_value, 2),
            "low_stock_items": low_stock_items,
        },
        "charts": {
            "production": [
                {"name": "Target", "value": round(total_target_quantity, 2)},
                {"name": "Produced", "value": round(total_produced_quantity, 2)},
                {"name": "Waste", "value": round(total_waste, 2)},
            ],
            "quality": [
                {"name": "Passed", "value": max(total_quality_checks - failed_quality_checks, 0)},
                {"name": "Failed", "value": failed_quality_checks},
            ],
            "finance": [
                {"name": "Sales", "value": round(total_sales_revenue, 2)},
                {"name": "Purchases", "value": round(total_purchase_value, 2)},
                {"name": "Inventory Value", "value": round(inventory_value, 2)},
            ],
        },
        "insights": [
            {
                "title": "Inventory Risk",
                "message": f"{low_stock_items} inventory items are below or near minimum stock.",
                "severity": "High" if low_stock_items > 0 else "Low",
            },
            {
                "title": "Production Performance",
                "message": f"Production efficiency is {round(production_efficiency, 2)}%.",
                "severity": "High" if production_efficiency < 70 else "Medium",
            },
            {
                "title": "Quality Performance",
                "message": f"Quality pass rate is {round(quality_pass_rate, 2)}%.",
                "severity": "High" if quality_pass_rate < 90 else "Low",
            },
            {
                "title": "Downtime",
                "message": f"Total downtime is {round(downtime_hours, 2)} hours.",
                "severity": "Medium" if downtime_hours > 2 else "Low",
            },
        ],
    }