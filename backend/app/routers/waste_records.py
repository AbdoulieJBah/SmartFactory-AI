from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Product, User, WasteRecord
from schemas import WasteRecordCreate, WasteRecordResponse

router = APIRouter(prefix="/waste-records", tags=["Waste Records"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Waste Records",
            description=description,
        )
    )


@router.post("/", response_model=WasteRecordResponse, status_code=status.HTTP_201_CREATED)
def create_waste_record(
    record: WasteRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager", "Operator"])
    ),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == record.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_record = WasteRecord(**record.dict(), company_id=company.id)

    db.add(new_record)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created waste record ID {new_record.id}",
    )

    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/", response_model=list[WasteRecordResponse])
def get_waste_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(WasteRecord)
        .filter(WasteRecord.company_id == company.id)
        .order_by(WasteRecord.id.desc())
        .all()
    )


@router.get("/{record_id}", response_model=WasteRecordResponse)
def get_waste_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(WasteRecord)
        .filter(WasteRecord.id == record_id, WasteRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Waste record not found")

    return record


@router.put("/{record_id}", response_model=WasteRecordResponse)
def update_waste_record(
    record_id: int,
    record_update: WasteRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(WasteRecord)
        .filter(WasteRecord.id == record_id, WasteRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Waste record not found")

    product = (
        db.query(Product)
        .filter(Product.id == record_update.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in record_update.dict().items():
        setattr(record, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated waste record ID {record_id}",
    )

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{record_id}")
def delete_waste_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    record = (
        db.query(WasteRecord)
        .filter(WasteRecord.id == record_id, WasteRecord.company_id == company.id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Waste record not found")

    db.delete(record)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted waste record ID {record_id}",
    )

    db.commit()

    return {"message": "Waste record deleted successfully"}