from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ProductionOrder, ProductionSchedule

router = APIRouter(prefix="/scheduling", tags=["Scheduling"])


@router.get("/")
def get_production_schedule(db: Session = Depends(get_db)):
    schedules = (
        db.query(ProductionSchedule)
        .order_by(
            ProductionSchedule.schedule_date.asc(),
            ProductionSchedule.start_time.asc(),
        )
        .all()
    )

    return schedules


@router.post("/")
def create_schedule(payload: dict, db: Session = Depends(get_db)):
    schedule = ProductionSchedule(**payload)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/{schedule_id}")
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    return schedule


@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, payload: dict, db: Session = Depends(get_db)):
    schedule = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    for key, value in payload.items():
        setattr(schedule, key, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(schedule)
    db.commit()

    return {"message": "Schedule deleted successfully"}