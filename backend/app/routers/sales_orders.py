from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_company, require_roles
from models import AuditLog, Company, Customer, Product, SalesOrder, User
from schemas import SalesOrderCreate, SalesOrderResponse

router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


def write_audit_log(db: Session, user: User, action: str, description: str):
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            module="Sales Orders",
            description=description,
        )
    )


@router.post("/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    order: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == order.customer_id, Customer.company_id == company.id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    product = (
        db.query(Product)
        .filter(Product.id == order.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_order = SalesOrder(**order.dict(), company_id=company.id)

    db.add(new_order)
    db.flush()

    write_audit_log(
        db,
        current_user,
        "CREATE",
        f"Created sales order ID {new_order.id}",
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/", response_model=list[SalesOrderResponse])
def get_sales_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    return (
        db.query(SalesOrder)
        .filter(SalesOrder.company_id == company.id)
        .order_by(SalesOrder.id.desc())
        .all()
    )


@router.get("/{order_id}", response_model=SalesOrderResponse)
def get_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(SalesOrder)
        .filter(SalesOrder.id == order_id, SalesOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    return order


@router.put("/{order_id}", response_model=SalesOrderResponse)
def update_sales_order(
    order_id: int,
    order_update: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(SalesOrder)
        .filter(SalesOrder.id == order_id, SalesOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    customer = (
        db.query(Customer)
        .filter(Customer.id == order_update.customer_id, Customer.company_id == company.id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    product = (
        db.query(Product)
        .filter(Product.id == order_update.product_id, Product.company_id == company.id)
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in order_update.dict().items():
        setattr(order, key, value)

    write_audit_log(
        db,
        current_user,
        "UPDATE",
        f"Updated sales order ID {order_id}",
    )

    db.commit()
    db.refresh(order)

    return order


@router.delete("/{order_id}")
def delete_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
    company: Company = Depends(get_current_company),
):
    order = (
        db.query(SalesOrder)
        .filter(SalesOrder.id == order_id, SalesOrder.company_id == company.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    db.delete(order)

    write_audit_log(
        db,
        current_user,
        "DELETE",
        f"Deleted sales order ID {order_id}",
    )

    db.commit()

    return {"message": "Sales order deleted successfully"}