from datetime import date, datetime, timedelta
import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    get_current_user,
    require_production_access,
    require_read_access,
)
from models import Company, Inventory, ProductionOrder, ProductionSchedule, WorkCenter
from schemas import (
    ProductionScheduleCreate,
    ProductionScheduleUpdate,
    ScheduleReassignRequest,
    ScheduleWorkflowStatusUpdate,
)

router = APIRouter(
    prefix="/scheduling",
    tags=["Scheduling"],
    dependencies=[Depends(get_current_user)],
)

PRIORITY_SCORE = {
    "Urgent": 4,
    "High": 3,
    "Normal": 2,
    "Low": 1,
}

VALID_STATUSES = [
    "Planned",
    "Released",
    "In Progress",
    "Completed",
    "Delayed",
    "Cancelled",
]


def priority_score(priority: Optional[str]) -> int:
    return PRIORITY_SCORE.get(priority or "Normal", 2)


def normalize_date(value):
    if isinstance(value, date):
        return value

    if isinstance(value, str):
        return datetime.strptime(value, "%Y-%m-%d").date()

    return value


def time_overlap(start_a: str, end_a: str, start_b: str, end_b: str) -> bool:
    return start_a < end_b and start_b < end_a


def get_work_center_load(db: Session, work_center_id: int, company_id: int) -> float:
    schedules = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.company_id == company_id,
            ProductionSchedule.work_center_id == work_center_id,
            ProductionSchedule.status != "Completed",
            ProductionSchedule.status != "Cancelled",
        )
        .all()
    )

    if not schedules:
        return 0

    return sum(float(s.capacity_load or 0) for s in schedules) / len(schedules)


def check_schedule_conflict(
    db: Session,
    payload: dict,
    company_id: int,
    schedule_id: Optional[int] = None,
) -> bool:
    work_center_id = payload.get("work_center_id")
    schedule_date = payload.get("schedule_date")
    start_time = payload.get("start_time")
    end_time = payload.get("end_time")

    if not work_center_id or not schedule_date or not start_time or not end_time:
        return False

    schedule_date = normalize_date(schedule_date)

    query = db.query(ProductionSchedule).filter(
        ProductionSchedule.company_id == company_id,
        ProductionSchedule.work_center_id == work_center_id,
        ProductionSchedule.schedule_date == schedule_date,
        ProductionSchedule.status != "Completed",
        ProductionSchedule.status != "Cancelled",
    )

    if schedule_id:
        query = query.filter(ProductionSchedule.id != schedule_id)

    existing_schedules = query.all()

    for item in existing_schedules:
        if time_overlap(start_time, end_time, item.start_time, item.end_time):
            return True

    return False


def check_material_status(db: Session, order_id: Optional[int], company_id: int) -> str:
    if not order_id:
        return "Unchecked"

    order = (
        db.query(ProductionOrder)
        .filter(ProductionOrder.id == order_id, ProductionOrder.company_id == company_id)
        .first()
    )

    if not order:
        return "Order Not Found"

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == order.product_id,
            Inventory.company_id == company_id,
        )
        .first()
    )

    if not inventory:
        return "No Inventory"

    available_qty = float(inventory.quantity or 0) - float(inventory.reserved_quantity or 0)
    required_qty = float(order.target_quantity or 0)

    if available_qty >= required_qty:
        return "Available"

    return "Insufficient"


def calculate_capacity_load(order: ProductionOrder) -> float:
    target = float(order.target_quantity or 0)

    if target <= 0:
        return 40

    return min(100, max(40, round((target / 1500) * 100, 2)))


def best_available_work_center(
    db: Session,
    work_centers: list[WorkCenter],
    schedule_date: date,
    start_time: str,
    end_time: str,
    company_id: int,
) -> Optional[WorkCenter]:
    candidates = []

    for wc in work_centers:
        payload = {
            "work_center_id": wc.id,
            "schedule_date": schedule_date,
            "start_time": start_time,
            "end_time": end_time,
        }

        has_conflict = check_schedule_conflict(db, payload, company_id)
        load = get_work_center_load(db, wc.id, company_id)

        if not has_conflict:
            candidates.append((wc, load))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[1])
    return candidates[0][0]


@router.get("/")
def get_schedules(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    work_center_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    query = db.query(ProductionSchedule).filter(ProductionSchedule.company_id == company.id)

    if start_date:
        query = query.filter(ProductionSchedule.schedule_date >= start_date)

    if end_date:
        query = query.filter(ProductionSchedule.schedule_date <= end_date)

    if status:
        query = query.filter(ProductionSchedule.status == status)

    if work_center_id:
        query = query.filter(ProductionSchedule.work_center_id == work_center_id)

    return (
        query.order_by(
            ProductionSchedule.schedule_date.asc(),
            ProductionSchedule.start_time.asc(),
        )
        .all()
    )


@router.post("/")
def create_schedule(
    request: ProductionScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    if request.status and request.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid schedule status")

    payload = request.model_dump()
    payload["schedule_date"] = normalize_date(payload.get("schedule_date"))
    payload["company_id"] = company.id

    if payload.get("order_id"):
        order = (
            db.query(ProductionOrder)
            .filter(
                ProductionOrder.id == payload["order_id"],
                ProductionOrder.company_id == company.id,
            )
            .first()
        )

        if not order:
            raise HTTPException(status_code=404, detail="Production order not found")

    if payload.get("work_center_id"):
        work_center = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == payload["work_center_id"],
                WorkCenter.company_id == company.id,
            )
            .first()
        )

        if not work_center:
            raise HTTPException(status_code=404, detail="Work center not found")

    has_conflict = check_schedule_conflict(db, payload, company.id)
    material_status = check_material_status(db, payload.get("order_id"), company.id)

    schedule = ProductionSchedule(
        **payload,
        conflict_status="Conflict" if has_conflict else "Clear",
        material_status=material_status,
        schedule_type=payload.get("schedule_type", "Manual"),
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


@router.get("/capacity")
def get_capacity(
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    work_centers = db.query(WorkCenter).filter(WorkCenter.company_id == company.id).all()
    schedules = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .all()
    )

    result = []

    for wc in work_centers:
        wc_schedules = [
            s
            for s in schedules
            if s.work_center_id == wc.id
            and s.status not in ["Completed", "Cancelled"]
        ]

        avg_load = (
            sum(float(s.capacity_load or 0) for s in wc_schedules) / len(wc_schedules)
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


@router.get("/gantt")
def get_gantt_data(
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    schedules = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .order_by(
            ProductionSchedule.schedule_date.asc(),
            ProductionSchedule.start_time.asc(),
        )
        .all()
    )

    result = []

    for item in schedules:
        order = (
            db.query(ProductionOrder)
            .filter(
                ProductionOrder.id == item.order_id,
                ProductionOrder.company_id == company.id,
            )
            .first()
            if item.order_id
            else None
        )

        work_center = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == item.work_center_id,
                WorkCenter.company_id == company.id,
            )
            .first()
            if item.work_center_id
            else None
        )

        result.append(
            {
                "id": item.id,
                "order_id": item.order_id,
                "order_number": order.order_number if order else None,
                "work_center_id": item.work_center_id,
                "work_center_name": work_center.name if work_center else "Unassigned",
                "date": item.schedule_date,
                "shift": item.shift,
                "start_time": item.start_time,
                "end_time": item.end_time,
                "status": item.status,
                "priority": item.priority,
                "capacity_load": item.capacity_load,
                "assigned_operator": item.assigned_operator,
                "material_status": item.material_status,
                "conflict_status": item.conflict_status,
                "schedule_type": item.schedule_type,
                "notes": item.notes,
            }
        )

    return result


@router.post("/auto-generate")
def auto_generate_schedule(
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    open_orders = (
        db.query(ProductionOrder)
        .filter(ProductionOrder.company_id == company.id)
        .filter(ProductionOrder.status != "Completed")
        .filter(ProductionOrder.status != "Cancelled")
        .all()
    )

    work_centers = (
        db.query(WorkCenter)
        .filter(WorkCenter.company_id == company.id)
        .filter(WorkCenter.status == "Running")
        .all()
    )

    if not open_orders:
        return {"message": "No open production orders found", "created": 0}

    if not work_centers:
        raise HTTPException(status_code=400, detail="No running work centers available")

    existing_order_ids = {
        s.order_id
        for s in db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .all()
        if s.order_id is not None
    }

    unscheduled_orders = [
        order for order in open_orders if order.id not in existing_order_ids
    ]

    if not unscheduled_orders:
        return {
            "message": "All open production orders are already scheduled",
            "created": 0,
        }

    unscheduled_orders.sort(
        key=lambda order: (
            -priority_score(order.priority),
            order.id,
        )
    )

    today = date.today()
    created = 0
    skipped = 0

    time_slots = [
        ("Morning", "08:00", "12:00"),
        ("Afternoon", "13:00", "17:00"),
        ("Night", "18:00", "22:00"),
    ]

    for order in unscheduled_orders:
        assigned = False

        for day_offset in range(0, 14):
            schedule_day = today + timedelta(days=day_offset)

            for shift, start_time, end_time in time_slots:
                work_center = best_available_work_center(
                    db=db,
                    work_centers=work_centers,
                    schedule_date=schedule_day,
                    start_time=start_time,
                    end_time=end_time,
                    company_id=company.id,
                )

                if not work_center:
                    continue

                capacity_load = calculate_capacity_load(order)
                material_status = check_material_status(db, order.id, company.id)

                schedule = ProductionSchedule(
                    company_id=company.id,
                    order_id=order.id,
                    work_center_id=work_center.id,
                    schedule_date=schedule_day,
                    shift=shift,
                    start_time=start_time,
                    end_time=end_time,
                    priority=order.priority or "Normal",
                    status="Planned",
                    capacity_load=capacity_load,
                    assigned_operator=None,
                    material_status=material_status,
                    conflict_status="Clear",
                    schedule_type="Auto",
                    notes="Auto-generated optimized schedule",
                )

                db.add(schedule)
                created += 1
                assigned = True
                break

            if assigned:
                break

        if not assigned:
            skipped += 1

    db.commit()

    return {
        "message": "Optimized production schedule generated",
        "created": created,
        "skipped": skipped,
    }


@router.post("/reallocate")
def reallocate_machines(
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    schedules = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .filter(ProductionSchedule.status != "Completed")
        .filter(ProductionSchedule.status != "Cancelled")
        .all()
    )

    running_centers = (
        db.query(WorkCenter)
        .filter(WorkCenter.company_id == company.id)
        .filter(WorkCenter.status == "Running")
        .all()
    )

    if not running_centers:
        raise HTTPException(
            status_code=400,
            detail="No running work centers available for reallocation",
        )

    moved = 0

    for schedule in schedules:
        current_wc = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == schedule.work_center_id,
                WorkCenter.company_id == company.id,
            )
            .first()
            if schedule.work_center_id
            else None
        )

        overloaded = float(schedule.capacity_load or 0) >= 90
        down_machine = current_wc and current_wc.status.lower() != "running"
        conflict = schedule.conflict_status == "Conflict"

        if overloaded or down_machine or conflict:
            best_wc = best_available_work_center(
                db=db,
                work_centers=running_centers,
                schedule_date=schedule.schedule_date,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                company_id=company.id,
            )

            if not best_wc:
                schedule.conflict_status = "Conflict"
                continue

            schedule.work_center_id = best_wc.id
            schedule.capacity_load = min(85, float(schedule.capacity_load or 75))
            schedule.conflict_status = "Clear"
            schedule.schedule_type = "Reallocated"
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


@router.post("/{schedule_id}/workflow")
def update_workflow_status(
    schedule_id: int,
    request: ScheduleWorkflowStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    new_status = request.status

    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid workflow status")

    schedule = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.id == schedule_id,
            ProductionSchedule.company_id == company.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.status = new_status

    if new_status == "Released":
        schedule.material_status = check_material_status(db, schedule.order_id, company.id)

        if schedule.material_status in ["Insufficient", "No Inventory"]:
            schedule.conflict_status = "Conflict"

    db.commit()
    db.refresh(schedule)

    return schedule


@router.post("/{schedule_id}/reassign")
def reassign_schedule(
    schedule_id: int,
    request: ScheduleReassignRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    payload = request.model_dump(exclude_unset=True)

    schedule = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.id == schedule_id,
            ProductionSchedule.company_id == company.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if "work_center_id" in payload:
        work_center = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == payload["work_center_id"],
                WorkCenter.company_id == company.id,
            )
            .first()
        )

        if not work_center:
            raise HTTPException(status_code=404, detail="Work center not found")

        schedule.work_center_id = payload["work_center_id"]

    if "schedule_date" in payload:
        schedule.schedule_date = normalize_date(payload["schedule_date"])

    if "start_time" in payload:
        schedule.start_time = payload["start_time"]

    if "end_time" in payload:
        schedule.end_time = payload["end_time"]

    if "assigned_operator" in payload:
        schedule.assigned_operator = payload["assigned_operator"]

    conflict_payload = {
        "work_center_id": schedule.work_center_id,
        "schedule_date": schedule.schedule_date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
    }

    schedule.conflict_status = (
        "Conflict"
        if check_schedule_conflict(db, conflict_payload, company.id, schedule_id=schedule.id)
        else "Clear"
    )

    schedule.material_status = check_material_status(db, schedule.order_id, company.id)
    schedule.schedule_type = "Manual Reassign"

    db.commit()
    db.refresh(schedule)

    return schedule


@router.get("/material-check/{order_id}")
def material_check(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(ProductionOrder)
        .filter(ProductionOrder.id == order_id, ProductionOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == order.product_id,
            Inventory.company_id == company.id,
        )
        .first()
    )

    if not inventory:
        return {
            "order_id": order.id,
            "status": "No Inventory",
            "available_quantity": 0,
            "required_quantity": order.target_quantity,
            "shortage": order.target_quantity,
        }

    available = float(inventory.quantity or 0) - float(inventory.reserved_quantity or 0)
    required = float(order.target_quantity or 0)

    return {
        "order_id": order.id,
        "status": "Available" if available >= required else "Insufficient",
        "available_quantity": available,
        "required_quantity": required,
        "shortage": max(0, required - available),
    }


@router.get("/machine-availability")
def machine_availability(
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    work_centers = db.query(WorkCenter).filter(WorkCenter.company_id == company.id).all()
    schedules = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .all()
    )

    result = []

    for wc in work_centers:
        wc_schedules = [s for s in schedules if s.work_center_id == wc.id]

        result.append(
            {
                "work_center_id": wc.id,
                "work_center_name": wc.name,
                "machine_status": wc.status,
                "scheduled_slots": [
                    {
                        "schedule_id": s.id,
                        "date": s.schedule_date,
                        "start_time": s.start_time,
                        "end_time": s.end_time,
                        "status": s.status,
                        "priority": s.priority,
                    }
                    for s in wc_schedules
                ],
            }
        )

    return result


@router.get("/export")
def export_schedule(
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    schedules = (
        db.query(ProductionSchedule)
        .filter(ProductionSchedule.company_id == company.id)
        .order_by(
            ProductionSchedule.schedule_date.asc(),
            ProductionSchedule.start_time.asc(),
        )
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(
        [
            "ID",
            "Order ID",
            "Work Center ID",
            "Date",
            "Shift",
            "Start",
            "End",
            "Priority",
            "Status",
            "Capacity Load",
            "Operator",
            "Material Status",
            "Conflict Status",
            "Schedule Type",
            "Notes",
        ]
    )

    for s in schedules:
        writer.writerow(
            [
                s.id,
                s.order_id,
                s.work_center_id,
                s.schedule_date,
                s.shift,
                s.start_time,
                s.end_time,
                s.priority,
                s.status,
                s.capacity_load,
                s.assigned_operator,
                s.material_status,
                s.conflict_status,
                s.schedule_type,
                s.notes,
            ]
        )

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=production_schedule.csv"
        },
    )


@router.get("/{schedule_id}")
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    schedule = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.id == schedule_id,
            ProductionSchedule.company_id == company.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    return schedule


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    request: ProductionScheduleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    schedule = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.id == schedule_id,
            ProductionSchedule.company_id == company.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    payload = request.model_dump(exclude_unset=True)

    if payload.get("status") and payload["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid schedule status")

    if "schedule_date" in payload:
        payload["schedule_date"] = normalize_date(payload["schedule_date"])

    if "order_id" in payload and payload["order_id"]:
        order = (
            db.query(ProductionOrder)
            .filter(
                ProductionOrder.id == payload["order_id"],
                ProductionOrder.company_id == company.id,
            )
            .first()
        )

        if not order:
            raise HTTPException(status_code=404, detail="Production order not found")

    if "work_center_id" in payload and payload["work_center_id"]:
        work_center = (
            db.query(WorkCenter)
            .filter(
                WorkCenter.id == payload["work_center_id"],
                WorkCenter.company_id == company.id,
            )
            .first()
        )

        if not work_center:
            raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in payload.items():
        setattr(schedule, key, value)

    conflict_payload = {
        "work_center_id": schedule.work_center_id,
        "schedule_date": schedule.schedule_date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
    }

    schedule.conflict_status = (
        "Conflict"
        if check_schedule_conflict(db, conflict_payload, company.id, schedule_id=schedule.id)
        else "Clear"
    )

    schedule.material_status = check_material_status(db, schedule.order_id, company.id)

    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    schedule = (
        db.query(ProductionSchedule)
        .filter(
            ProductionSchedule.id == schedule_id,
            ProductionSchedule.company_id == company.id,
        )
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(schedule)
    db.commit()

    return {"message": "Schedule deleted successfully"}
