from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ProductionOrder, ProductionSchedule, WorkCenter

router = APIRouter(prefix="/scheduling", tags=["Scheduling"])


PRIORITY_SCORE = {
    "Urgent": 3,
    "High": 2,
    "Normal": 1,
    "Low": 0,
}


def get_priority_score(priority: str):
    return PRIORITY_SCORE.get(priority, 1)


@router.get("/")
def get_schedules(db: Session = Depends(get_db)):
    return (
        db.query(ProductionSchedule)
        .order_by(
            ProductionSchedule.schedule_date.asc(),
            ProductionSchedule.start_time.asc(),
        )
        .all()
    )


@router.post("/")
def create_schedule(payload: dict, db: Session = Depends(get_db)):
    schedule = ProductionSchedule(**payload)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/capacity")
def get_capacity(db: Session = Depends(get_db)):
    work_centers = db.query(WorkCenter).all()
    schedules = db.query(ProductionSchedule).all()

    result = []

    for wc in work_centers:
        wc_schedules = [
            s for s in schedules if s.work_center_id == wc.id
        ]

        avg_load = (
            sum(float(s.capacity_load or 0) for s in wc_schedules)
            / len(wc_schedules)
            if wc_schedules
            else 0
        )

        result.append(
            {
                "work_center_id": wc.id,
                "work_center_name": wc.name,
                "status": wc.status,
                "scheduled_orders": len(wc_schedules),
                "average_capacity_load": round(avg_load, 2),
                "risk": (
                    "High"
                    if avg_load >= 90 or wc.status.lower() != "running"
                    else "Medium"
                    if avg_load >= 75
                    else "Low"
                ),
            }
        )

    return result


@router.post("/auto-generate")
def auto_generate_schedule(db: Session = Depends(get_db)):
    open_orders = (
        db.query(ProductionOrder)
        .filter(ProductionOrder.status != "Completed")
        .all()
    )

    work_centers = (
        db.query(WorkCenter)
        .filter(WorkCenter.status == "Running")
        .all()
    )

    if not open_orders:
        return {"message": "No open production orders found", "created": 0}

    if not work_centers:
        raise HTTPException(
            status_code=400,
            detail="No running work centers available",
        )

    existing_order_ids = {
        s.order_id
        for s in db.query(ProductionSchedule).all()
        if s.order_id is not None
    }

    unscheduled_orders = [
        order for order in open_orders if order.id not in existing_order_ids
    ]

    unscheduled_orders.sort(
        key=lambda order: (
            -get_priority_score(order.priority),
            order.id,
        )
    )

    today = date.today()
    created = 0
    work_center_index = 0

    for index, order in enumerate(unscheduled_orders):
        work_center = work_centers[work_center_index % len(work_centers)]

        schedule_day = today + timedelta(days=index // len(work_centers))
        start_hour = 8 + ((index % 2) * 4)
        end_hour = start_hour + 4

        target = float(order.target_quantity or 0)
        produced = float(order.produced_quantity or 0)

        capacity_load = 80
        if target > 0:
            capacity_load = min(100, max(40, round((target / 1500) * 100, 2)))

        schedule = ProductionSchedule(
            order_id=order.id,
            work_center_id=work_center.id,
            schedule_date=schedule_day,
            shift="Morning" if start_hour < 12 else "Afternoon",
            start_time=f"{start_hour:02d}:00",
            end_time=f"{end_hour:02d}:00",
            priority=order.priority or "Normal",
            status="Planned",
            capacity_load=capacity_load,
            notes="Auto-generated optimized schedule",
        )

        db.add(schedule)
        created += 1
        work_center_index += 1

    db.commit()

    return {
        "message": "Optimized production schedule generated",
        "created": created,
    }


@router.post("/reallocate")
def reallocate_machines(db: Session = Depends(get_db)):
    schedules = db.query(ProductionSchedule).all()
    work_centers = db.query(WorkCenter).all()

    running_centers = [
        wc for wc in work_centers if wc.status.lower() == "running"
    ]

    if not running_centers:
        raise HTTPException(
            status_code=400,
            detail="No running work centers available for reallocation",
        )

    moved = 0

    for schedule in schedules:
        current_wc = None

        if schedule.work_center_id:
            current_wc = (
                db.query(WorkCenter)
                .filter(WorkCenter.id == schedule.work_center_id)
                .first()
            )

        overloaded = float(schedule.capacity_load or 0) >= 90
        down_machine = current_wc and current_wc.status.lower() != "running"

        if overloaded or down_machine:
            best_wc = min(
                running_centers,
                key=lambda wc: sum(
                    float(s.capacity_load or 0)
                    for s in schedules
                    if s.work_center_id == wc.id
                ),
            )

            schedule.work_center_id = best_wc.id
            schedule.capacity_load = min(85, float(schedule.capacity_load or 75))
            schedule.notes = (
                f"{schedule.notes or ''} | Reallocated automatically "
                f"on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
            )
            moved += 1

    db.commit()

    return {
        "message": "Machine reallocation completed",
        "reallocated_orders": moved,
    }


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