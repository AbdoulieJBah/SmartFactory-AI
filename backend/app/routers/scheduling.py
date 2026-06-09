from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import ProductionOrder

router = APIRouter(prefix="/scheduling", tags=["Scheduling"])


@router.get("/")
def get_production_schedule(db: Session = Depends(get_db)):
    orders = (
        db.query(ProductionOrder)
        .order_by(ProductionOrder.priority.desc(), ProductionOrder.id.desc())
        .all()
    )

    schedule = []

    for order in orders:
        schedule.append({
            "id": order.id,
            "order_number": order.order_number,
            "product_id": order.product_id,
            "work_center_id": order.work_center_id,
            "target_quantity": order.target_quantity,
            "produced_quantity": order.produced_quantity,
            "priority": order.priority,
            "status": order.status,
            "start_date": order.start_date,
            "end_date": order.end_date,
        })

    return schedule