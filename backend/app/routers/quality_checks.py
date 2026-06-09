from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_current_company,
    require_quality_access,
    require_read_access,
)
from models import AuditLog, Company, ProductionOrder, QualityCheck, User
from schemas import QualityCheckCreate, QualityCheckResponse

router = APIRouter(prefix="/quality-checks", tags=["Quality Checks"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Quality Checks",
            description=description,
        )
    )


@router.post("/", response_model=QualityCheckResponse, status_code=status.HTTP_201_CREATED)
def create_quality_check(
    check: QualityCheckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_quality_access),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(ProductionOrder)
        .filter(
            ProductionOrder.id == check.production_order_id,
            ProductionOrder.company_id == company.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    new_check = QualityCheck(**check.dict(), company_id=company.id)

    db.add(new_check)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created quality check ID {new_check.id}",
    )

    db.commit()
    db.refresh(new_check)

    return new_check


@router.get("/", response_model=list[QualityCheckResponse])
def get_quality_checks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(QualityCheck)
        .filter(QualityCheck.company_id == company.id)
        .order_by(QualityCheck.id.desc())
        .all()
    )


@router.get("/{check_id}", response_model=QualityCheckResponse)
def get_quality_check(
    check_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
    company: Company = Depends(get_current_company),
):
    check = (
        db.query(QualityCheck)
        .filter(QualityCheck.id == check_id, QualityCheck.company_id == company.id)
        .first()
    )

    if not check:
        raise HTTPException(status_code=404, detail="Quality check not found")

    return check


@router.put("/{check_id}", response_model=QualityCheckResponse)
def update_quality_check(
    check_id: int,
    check_update: QualityCheckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_quality_access),
    company: Company = Depends(get_current_company),
):
    check = (
        db.query(QualityCheck)
        .filter(QualityCheck.id == check_id, QualityCheck.company_id == company.id)
        .first()
    )

    if not check:
        raise HTTPException(status_code=404, detail="Quality check not found")

    for key, value in check_update.dict().items():
        setattr(check, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated quality check ID {check_id}",
    )

    db.commit()
    db.refresh(check)

    return check


@router.delete("/{check_id}")
def delete_quality_check(
    check_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_quality_access),
    company: Company = Depends(get_current_company),
):
    check = (
        db.query(QualityCheck)
        .filter(QualityCheck.id == check_id, QualityCheck.company_id == company.id)
        .first()
    )

    if not check:
        raise HTTPException(status_code=404, detail="Quality check not found")

    db.delete(check)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted quality check ID {check_id}",
    )

    db.commit()

    return {"message": "Quality check deleted successfully"}