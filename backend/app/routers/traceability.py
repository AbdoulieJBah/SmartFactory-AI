from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, BatchTrace, Company, Product, Supplier, User
from schemas import BatchTraceCreate, BatchTraceResponse

router = APIRouter(prefix="/traceability", tags=["Traceability"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Traceability",
            description=description,
        )
    )


@router.post("/", response_model=BatchTraceResponse, status_code=status.HTTP_201_CREATED)
def create_batch_trace(
    batch: BatchTraceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    product = (
        db.query(Product)
        .filter(Product.id == batch.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if batch.supplier_id:
        supplier = (
            db.query(Supplier)
            .filter(Supplier.id == batch.supplier_id, Supplier.company_id == company.id)
            .first()
        )

        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")

    existing_batch = (
        db.query(BatchTrace)
        .filter(
            BatchTrace.batch_number == batch.batch_number,
            BatchTrace.company_id == company.id,
        )
        .first()
    )

    if existing_batch:
        raise HTTPException(status_code=400, detail="Batch number already exists")

    new_batch = BatchTrace(**batch.dict(), company_id=company.id)

    db.add(new_batch)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created batch trace {new_batch.batch_number}",
    )

    db.commit()
    db.refresh(new_batch)

    return new_batch


@router.get("/", response_model=list[BatchTraceResponse])
def get_batch_traces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(BatchTrace)
        .filter(BatchTrace.company_id == company.id)
        .order_by(BatchTrace.id.desc())
        .all()
    )


@router.get("/{batch_id}", response_model=BatchTraceResponse)
def get_batch_trace(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    batch = (
        db.query(BatchTrace)
        .filter(BatchTrace.id == batch_id, BatchTrace.company_id == company.id)
        .first()
    )

    if not batch:
        raise HTTPException(status_code=404, detail="Batch trace not found")

    return batch


@router.put("/{batch_id}", response_model=BatchTraceResponse)
def update_batch_trace(
    batch_id: int,
    batch_update: BatchTraceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager", "Production Manager"])
    ),
    company: Company = Depends(get_current_company),
):
    batch = (
        db.query(BatchTrace)
        .filter(BatchTrace.id == batch_id, BatchTrace.company_id == company.id)
        .first()
    )

    if not batch:
        raise HTTPException(status_code=404, detail="Batch trace not found")

    product = (
        db.query(Product)
        .filter(Product.id == batch_update.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if batch_update.supplier_id:
        supplier = (
            db.query(Supplier)
            .filter(
                Supplier.id == batch_update.supplier_id,
                Supplier.company_id == company.id,
            )
            .first()
        )

        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in batch_update.dict().items():
        setattr(batch, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated batch trace ID {batch_id}",
    )

    db.commit()
    db.refresh(batch)

    return batch


@router.delete("/{batch_id}")
def delete_batch_trace(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    batch = (
        db.query(BatchTrace)
        .filter(BatchTrace.id == batch_id, BatchTrace.company_id == company.id)
        .first()
    )

    if not batch:
        raise HTTPException(status_code=404, detail="Batch trace not found")

    db.delete(batch)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted batch trace ID {batch_id}",
    )

    db.commit()

    return {"message": "Batch trace deleted successfully"}