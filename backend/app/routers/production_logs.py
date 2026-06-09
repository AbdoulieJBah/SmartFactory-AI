from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import ProductionLog, ProductionOrder
from schemas import ProductionLogCreate, ProductionLogResponse

router = APIRouter(prefix="/production-logs", tags=["Production Logs"])


@router.post("/", response_model=ProductionLogResponse, status_code=status.HTTP_201_CREATED)
def create_production_log(log: ProductionLogCreate, db: Session = Depends(get_db)):
    order = db.query(ProductionOrder).filter(
        ProductionOrder.id == log.production_order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    new_log = ProductionLog(**log.dict())

    order.produced_quantity = (order.produced_quantity or 0) + log.quantity_produced

    if order.produced_quantity >= order.target_quantity:
        order.status = "Completed"
    elif order.produced_quantity > 0:
        order.status = "In Progress"

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


@router.get("/", response_model=list[ProductionLogResponse])
def get_production_logs(db: Session = Depends(get_db)):
    return db.query(ProductionLog).order_by(ProductionLog.id.desc()).all()


@router.get("/{log_id}", response_model=ProductionLogResponse)
def get_production_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(ProductionLog).filter(ProductionLog.id == log_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="Production log not found")

    return log


@router.delete("/{log_id}")
def delete_production_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(ProductionLog).filter(ProductionLog.id == log_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="Production log not found")

    order = db.query(ProductionOrder).filter(
        ProductionOrder.id == log.production_order_id
    ).first()

    if order:
        order.produced_quantity = max(
            0,
            (order.produced_quantity or 0) - log.quantity_produced
        )

        if order.produced_quantity == 0:
            order.status = "Planned"
        elif order.produced_quantity < order.target_quantity:
            order.status = "In Progress"

    db.delete(log)
    db.commit()

    return {"message": "Production log deleted successfully"}