from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    require_plant_manager,
)
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
from services.ai_service import generate_ai_response

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


class AIRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_ai(
    request: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plant_manager),
    company: Company = Depends(get_current_company),
):
    company_id = company.id

    total_products = db.query(Product).filter(Product.company_id == company_id).count()
    total_suppliers = db.query(Supplier).filter(Supplier.company_id == company_id).count()
    total_customers = db.query(Customer).filter(Customer.company_id == company_id).count()

    total_inventory = (
        db.query(func.sum(Inventory.quantity))
        .filter(Inventory.company_id == company_id)
        .scalar()
    ) or 0

    inventory_value = (
        db.query(func.sum(Inventory.quantity * Product.cost_price))
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.company_id == company_id,
            Product.company_id == company_id,
        )
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
        .limit(10)
        .all()
    )

    open_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status != "Completed",
        )
        .limit(10)
        .all()
    )

    active_orders = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.company_id == company_id,
            ProductionOrder.status != "Completed",
        )
        .count()
    )

    total_target = (
        db.query(func.sum(ProductionOrder.target_quantity))
        .filter(ProductionOrder.company_id == company_id)
        .scalar()
    ) or 0

    total_produced = (
        db.query(func.sum(ProductionOrder.produced_quantity))
        .filter(ProductionOrder.company_id == company_id)
        .scalar()
    ) or 0

    production_efficiency = (
        (total_produced / total_target) * 100 if total_target > 0 else 0
    )

    total_waste = (
        db.query(func.sum(WasteRecord.quantity))
        .filter(WasteRecord.company_id == company_id)
        .scalar()
    ) or 0

    waste_rate = (
        (total_waste / (total_produced + total_waste)) * 100
        if (total_produced + total_waste) > 0
        else 0
    )

    downtime_minutes = (
        db.query(func.sum(DowntimeRecord.duration_minutes))
        .filter(DowntimeRecord.company_id == company_id)
        .scalar()
    ) or 0

    top_downtime = (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.company_id == company_id)
        .order_by(DowntimeRecord.duration_minutes.desc())
        .limit(10)
        .all()
    )

    total_quality_checks = (
        db.query(QualityCheck)
        .filter(QualityCheck.company_id == company_id)
        .count()
    )

    failed_quality_count = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail",
        )
        .count()
    )

    failed_quality_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company_id,
            QualityCheck.result == "Fail",
        )
        .limit(10)
        .all()
    )

    quality_pass_rate = (
        ((total_quality_checks - failed_quality_count) / total_quality_checks) * 100
        if total_quality_checks > 0
        else 100
    )

    sales_value = (
        db.query(func.sum(SalesOrder.quantity * SalesOrder.unit_price))
        .filter(SalesOrder.company_id == company_id)
        .scalar()
    ) or 0

    purchase_value = (
        db.query(func.sum(PurchaseOrder.quantity * PurchaseOrder.unit_price))
        .filter(PurchaseOrder.company_id == company_id)
        .scalar()
    ) or 0

    factory_context = {
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "country": company.country,
            "city": company.city,
        },
        "user": {
            "id": current_user.id,
            "name": current_user.full_name,
            "role": current_user.role,
        },
        "executive_kpis": {
            "total_products": total_products,
            "total_suppliers": total_suppliers,
            "total_customers": total_customers,
            "total_inventory_units": round(total_inventory, 2),
            "inventory_value": round(inventory_value, 2),
            "active_production_orders": active_orders,
            "total_target_quantity": round(total_target, 2),
            "total_produced_quantity": round(total_produced, 2),
            "production_efficiency_percent": round(production_efficiency, 2),
            "total_waste_units": round(total_waste, 2),
            "waste_rate_percent": round(waste_rate, 2),
            "downtime_minutes": round(downtime_minutes, 2),
            "downtime_hours": round(downtime_minutes / 60, 2),
            "quality_pass_rate_percent": round(quality_pass_rate, 2),
            "failed_quality_checks": failed_quality_count,
            "sales_value": round(sales_value, 2),
            "purchase_value": round(purchase_value, 2),
        },
        "inventory_risks": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Unknown",
                "warehouse": item.warehouse,
                "quantity": item.quantity,
                "min_stock": item.min_stock,
                "shortage_gap": max(0, item.min_stock - item.quantity),
            }
            for item in low_stock_items
        ],
        "open_production_orders": [
            {
                "order_number": order.order_number,
                "product_id": order.product_id,
                "product_name": order.product.name if order.product else "Unknown",
                "target_quantity": order.target_quantity,
                "produced_quantity": order.produced_quantity,
                "completion_percent": round(
                    (order.produced_quantity / order.target_quantity) * 100,
                    2,
                )
                if order.target_quantity > 0
                else 0,
                "priority": order.priority,
                "status": order.status,
            }
            for order in open_orders
        ],
        "downtime_issues": [
            {
                "work_center_id": item.work_center_id,
                "work_center_name": item.work_center.name if item.work_center else "Unknown",
                "reason": item.reason,
                "duration_minutes": item.duration_minutes,
                "recorded_by": item.recorded_by,
            }
            for item in top_downtime
        ],
        "quality_failures": [
            {
                "production_order_id": item.production_order_id,
                "check_type": item.check_type,
                "result": item.result,
                "inspector_name": item.inspector_name,
                "defects_count": item.defects_count,
                "corrective_action": item.corrective_action,
                "notes": item.notes,
            }
            for item in failed_quality_checks
        ],
    }

    answer = generate_ai_response(
        question=request.question,
        factory_context=factory_context,
    )

    return {
        "question": request.question,
        "answer": answer,
        "company": {
            "id": company.id,
            "name": company.name,
        },
        "data_used": factory_context,
    }