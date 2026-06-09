from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Supplier, User
from schemas import SupplierCreate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Suppliers",
            description=description,
        )
    )


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    new_supplier = Supplier(**supplier.dict(), company_id=company.id)

    db.add(new_supplier)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created supplier {new_supplier.name}",
    )

    db.commit()
    db.refresh(new_supplier)

    return new_supplier


@router.get("/", response_model=list[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(Supplier)
        .filter(Supplier.company_id == company.id)
        .order_by(Supplier.id.desc())
        .all()
    )


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.company_id == company.id)
        .first()
    )

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.company_id == company.id)
        .first()
    )

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    old_name = supplier.name

    for key, value in supplier_update.dict().items():
        setattr(supplier, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated supplier {old_name} with ID {supplier_id}",
    )

    db.commit()
    db.refresh(supplier)

    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.company_id == company.id)
        .first()
    )

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    supplier_name = supplier.name

    db.delete(supplier)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted supplier {supplier_name} with ID {supplier_id}",
    )

    db.commit()

    return {"message": "Supplier deleted successfully"}