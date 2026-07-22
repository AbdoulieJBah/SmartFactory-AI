from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    get_current_user,
    require_production_access,
    require_read_access,
)
from models import AuditLog, Company, User, WorkCenter
from schemas import WorkCenterCreate, WorkCenterResponse

router = APIRouter(
    prefix="/work-centers",
    tags=["Work Centers"],
    dependencies=[Depends(get_current_user)],
)


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Work Centers",
            description=description,
        )
    )


@router.post("/", response_model=WorkCenterResponse, status_code=status.HTTP_201_CREATED)
def create_work_center(
    center: WorkCenterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    new_center = WorkCenter(**center.dict(), company_id=company.id)

    db.add(new_center)
    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created work center {new_center.name}",
    )
    db.commit()
    db.refresh(new_center)

    return new_center


@router.get("/", response_model=list[WorkCenterResponse])
def get_work_centers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(WorkCenter)
        .filter(WorkCenter.company_id == company.id)
        .order_by(WorkCenter.id.desc())
        .all()
    )


@router.get("/{center_id}", response_model=WorkCenterResponse)
def get_work_center(
    center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    center = (
        db.query(WorkCenter)
        .filter(WorkCenter.id == center_id, WorkCenter.company_id == company.id)
        .first()
    )

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    return center


@router.put("/{center_id}", response_model=WorkCenterResponse)
def update_work_center(
    center_id: int,
    center_update: WorkCenterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    center = (
        db.query(WorkCenter)
        .filter(WorkCenter.id == center_id, WorkCenter.company_id == company.id)
        .first()
    )

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in center_update.dict().items():
        setattr(center, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated work center {center.name}",
    )

    db.commit()
    db.refresh(center)

    return center


@router.delete("/{center_id}")
def delete_work_center(
    center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_production_access),
    company: Company = Depends(get_current_company),
):
    center = (
        db.query(WorkCenter)
        .filter(WorkCenter.id == center_id, WorkCenter.company_id == company.id)
        .first()
    )

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    center_name = center.name
    db.delete(center)
    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted work center {center_name}",
    )
    db.commit()

    return {"message": "Work center deleted successfully"}
