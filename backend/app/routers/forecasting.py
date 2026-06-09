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
    SalesOrder,
    User,
)

router = APIRouter(prefix="/forecasting", tags=["Forecasting"])


@router.get("/")
def get_forecasting(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    company_id = company.id

    total_sales_quantity = (
        db.query(func.sum(SalesOrder.quantity))
        .filter(SalesOrder.company_id == company_id)
        .scalar()
    ) or 0

    total_production_target = (
        db.query(func.sum(ProductionOrder.target_quantity))
        .filter(ProductionOrder.company_id == company_id)
        .scalar()
    ) or 0

    total_inventory = (
        db.query(func.sum(Inventory.quantity))
        .filter(Inventory.company_id == company_id)
        .scalar()
    ) or 0

    low_stock_items = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.company_id == company_id,
            Product.company_id == company_id,
            Inventory.quantity <= Inventory.min_stock,
        )
        .all()
    )

    demand_forecast = round((total_sales_quantity + total_production_target) * 1.1, 2)
    inventory_gap = round(max(0, demand_forecast - total_inventory), 2)
    risk_level = "High" if inventory_gap > 0 or len(low_stock_items) > 0 else "Low"

    return {
        "company": {
            "id": company.id,
            "name": company.name,
        },
        "summary": {
            "total_sales_quantity": total_sales_quantity,
            "total_production_target": total_production_target,
            "total_inventory": total_inventory,
            "demand_forecast": demand_forecast,
            "inventory_gap": inventory_gap,
            "low_stock_count": len(low_stock_items),
            "risk_level": risk_level,
        },
        "chart_data": [
            {"name": "Sales Demand", "value": total_sales_quantity},
            {"name": "Production Target", "value": total_production_target},
            {"name": "Current Inventory", "value": total_inventory},
            {"name": "Forecast Demand", "value": demand_forecast},
        ],
        "recommendations": [
            {
                "title": "Inventory Planning",
                "message": (
                    f"Inventory gap is {inventory_gap} units."
                    if inventory_gap > 0
                    else "Current inventory can cover forecast demand."
                ),
            },
            {
                "title": "Low Stock",
                "message": f"{len(low_stock_items)} items are below minimum stock.",
            },
        ],
    }