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
    DowntimeRecord,
    ProductionOrder,
    QualityCheck,
    User,
)

router = APIRouter(
    prefix="/oee",
    tags=["OEE"]
)


@router.get("/")
def get_oee(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    planned_minutes = 480

    downtime_minutes = (
        db.query(
            func.sum(
                DowntimeRecord.duration_minutes
            )
        )
        .filter(
            DowntimeRecord.company_id == company.id
        )
        .scalar()
    ) or 0

    runtime_minutes = max(
        planned_minutes - downtime_minutes,
        0
    )

    availability = (
        runtime_minutes / planned_minutes * 100
        if planned_minutes > 0
        else 0
    )

    total_target = (
        db.query(
            func.sum(
                ProductionOrder.target_quantity
            )
        )
        .filter(
            ProductionOrder.company_id == company.id
        )
        .scalar()
    ) or 0

    total_produced = (
        db.query(
            func.sum(
                ProductionOrder.produced_quantity
            )
        )
        .filter(
            ProductionOrder.company_id == company.id
        )
        .scalar()
    ) or 0

    performance = (
        total_produced / total_target * 100
        if total_target > 0
        else 0
    )

    quality_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company.id
        )
        .count()
    )

    failed_checks = (
        db.query(QualityCheck)
        .filter(
            QualityCheck.company_id == company.id,
            QualityCheck.result == "Fail",
        )
        .count()
    )

    quality = (
        (
            (quality_checks - failed_checks)
            / quality_checks
        ) * 100
        if quality_checks > 0
        else 100
    )

    oee = (
        availability *
        performance *
        quality
    ) / 10000

    return {
        "company": {
            "id": company.id,
            "name": company.name,
        },
        "planned_minutes": planned_minutes,
        "runtime_minutes": round(runtime_minutes, 2),
        "downtime_minutes": round(downtime_minutes, 2),
        "availability": round(availability, 2),
        "performance": round(performance, 2),
        "quality": round(quality, 2),
        "oee": round(oee, 2),
        "total_target": round(total_target, 2),
        "total_produced": round(total_produced, 2),
        "total_quality_checks": quality_checks,
        "failed_quality_checks": failed_checks,
        "loss_reasons": [
            {
                "area": "Availability",
                "issue": f"{round(downtime_minutes,2)} minutes downtime",
                "recommendation": "Reduce machine downtime through preventive maintenance",
            },
            {
                "area": "Performance",
                "issue": "Production output below target",
                "recommendation": "Improve scheduling and machine utilization",
            },
            {
                "area": "Quality",
                "issue": f"{failed_checks} failed quality checks",
                "recommendation": "Review quality control procedures",
            },
        ],
    }