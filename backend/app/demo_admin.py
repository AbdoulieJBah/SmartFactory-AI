"""Explicit operator commands; never run automatically at startup."""
import argparse
from getpass import getpass

from auth import hash_password
from database import SessionLocal
from models import (
    Company, User, UserCompany, Product, Inventory, WorkCenter,
    ProductionOrder, ProductionLog, QualityCheck, WasteRecord, DowntimeRecord,
)

DEMO_COMPANY = "SmartFactory Portfolio Demo (Synthetic)"


def validate_password(password):
    if len(password) < 16 or len(password.encode('utf-8')) > 72:
        raise ValueError("Use a password of at least 16 characters and at most 72 UTF-8 bytes")


def provision_demo(db, email, password):
    """Create one isolated synthetic company. Refuse to repurpose existing accounts."""
    validate_password(password)
    user = db.query(User).filter_by(email=email).first()
    company = db.query(Company).filter_by(name=DEMO_COMPANY).first()
    if user or company:
        if not user or not company or user.role != 'Viewer':
            raise ValueError('Existing account/company does not match the restricted demo; no changes made')
        memberships = db.query(UserCompany).filter_by(user_id=user.id).all()
        company_users = db.query(UserCompany).filter_by(company_id=company.id).all()
        if (len(memberships) != 1 or memberships[0].company_id != company.id
                or memberships[0].role != 'Viewer' or len(company_users) != 1):
            raise ValueError('Demo must have exactly one Viewer account and one company membership')
        # Re-running never reseeds, deletes or modifies business records.
        user.password_hash = hash_password(password)
        db.flush()
        return user

    company = Company(name=DEMO_COMPANY, industry='Synthetic manufacturing', country='Italy')
    db.add(company)
    db.flush()
    user = User(full_name='Portfolio Demo Viewer', email=email,
                password_hash=hash_password(password), role='Viewer')
    db.add(user)
    db.flush()
    db.add(UserCompany(user_id=user.id, company_id=company.id, role='Viewer'))
    center = WorkCenter(company_id=company.id, name='Demo packing line', status='Running')
    db.add(center)
    db.flush()
    for index, (name, quantity, cost) in enumerate([
        ('Sample Salad 250g', 800, 1.2), ('Sample Salad 500g', 600, 2.1),
        ('Sample Packaging Box', 1000, 0.15),
    ], 1):
        product = Product(company_id=company.id, sku=f'PORTFOLIO-{company.id}-{index}',
                          name=name, unit='pcs', cost_price=cost,
                          selling_price=cost * 2, reorder_level=50)
        db.add(product)
        db.flush()
        db.add(Inventory(company_id=company.id, product_id=product.id,
                         warehouse='Synthetic warehouse', quantity=quantity,
                         reserved_quantity=0, min_stock=50, max_stock=2000))
        order = ProductionOrder(company_id=company.id,
                                order_number=f'DEMO-{company.id}-{index}',
                                product_id=product.id, work_center_id=center.id,
                                target_quantity=1000, produced_quantity=quantity,
                                status='Completed' if quantity == 1000 else 'In Progress')
        db.add(order)
        db.flush()
        db.add(ProductionLog(company_id=company.id, production_order_id=order.id,
                             quantity_produced=quantity, operator_name='Synthetic operator'))
        db.add(QualityCheck(company_id=company.id, production_order_id=order.id,
                            check_type='Packaging', result='Pass', inspector_name='Synthetic inspector'))
        db.add(WasteRecord(company_id=company.id, product_id=product.id,
                           quantity=10, reason='Synthetic setup waste', recorded_by='Demo'))
    db.add(DowntimeRecord(company_id=company.id, work_center_id=center.id,
                          reason='Synthetic changeover', duration_minutes=30, recorded_by='Demo'))
    db.flush()
    return user


def rotate_password(db, email, password):
    validate_password(password)
    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise ValueError('Account not found; no changes made')
    user.password_hash = hash_password(password)
    db.flush()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['provision-demo', 'rotate-password'])
    parser.add_argument('--email', required=True)
    args = parser.parse_args()
    password = getpass('New password (hidden): ')
    if password != getpass('Repeat password: '):
        parser.error('Passwords do not match')
    try:
        with SessionLocal.begin() as db:
            if args.operation == 'provision-demo':
                provision_demo(db, args.email, password)
            else:
                rotate_password(db, args.email, password)
    except ValueError as exc:
        parser.error(str(exc))
    print('Completed. No password has been printed. Rotate SECRET_KEY to revoke existing sessions.')


if __name__ == '__main__':
    main()
