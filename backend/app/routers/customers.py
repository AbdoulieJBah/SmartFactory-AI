from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Customer, User
from schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Customers",
            description=description,
        )
    )


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    new_customer = Customer(**customer.dict(), company_id=company.id)

    db.add(new_customer)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created customer {new_customer.name}",
    )

    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("/", response_model=list[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(Customer)
        .filter(Customer.company_id == company.id)
        .order_by(Customer.id.desc())
        .all()
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.company_id == company.id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.company_id == company.id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    old_name = customer.name

    for key, value in customer_update.dict().items():
        setattr(customer, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated customer {old_name} with ID {customer_id}",
    )

    db.commit()
    db.refresh(customer)

    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.company_id == company.id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer_name = customer.name

    db.delete(customer)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted customer {customer_name} with ID {customer_id}",
    )

    db.commit()

    return {"message": "Customer deleted successfully"}