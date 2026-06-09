from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, DowntimeRecord, User, WorkCenter
from schemas import DowntimeCreate, DowntimeResponse

router = APIRouter(prefix="/downtime", tags=["Downtime"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Downtime",
            description=description,
        )
    )


@router.post("/", response_model=DowntimeResponse, status_code=status.HTTP_201_CREATED)
def create_downtime_record(
    record: DowntimeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager", "Operator"])
    ),
    company: Company = Depends(get_current_company),
):
    work_center = (
        db.query(WorkCenter)
        .filter(
            WorkCenter.id == record.work_center_id,
            WorkCenter.company_id == company.id,
        )
        .first()
    )

    if not work_center:
        raise HTTPException(status_code=404, detail="Work center not found")

    new_record = DowntimeRecord(**record.dict(), company_id=company.id)

    db.add(new_record)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created downtime record ID {new_record.id}",
    )

    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/", response_model=list[DowntimeResponse])
def get_downtime_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.company_id == company.id)
        .order_by(DowntimeRecord.id.desc())
        .all()
    )


@router.get("/{record_id}", response_model=DowntimeResponse)
def get_downtime_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.id == record_id, DowntimeRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Downtime record not found")

    return record


@router.put("/{record_id}", response_model=DowntimeResponse)
def update_downtime_record(
    record_id: int,
    record_update: DowntimeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.id == record_id, DowntimeRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Downtime record not found")

    work_center = (
        db.query(WorkCenter)
        .filter(
            WorkCenter.id == record_update.work_center_id,
            WorkCenter.company_id == company.id,
        )
        .first()
    )

    if not work_center:
        raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in record_update.dict().items():
        setattr(record, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated downtime record ID {record_id}",
    )

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{record_id}")
def delete_downtime_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(DowntimeRecord)
        .filter(DowntimeRecord.id == record_id, DowntimeRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Downtime record not found")

    db.delete(record)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted downtime record ID {record_id}",
    )

    db.commit()

    return {"message": "Downtime record deleted successfully"}