from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    monthly_price = Column(Float, default=0)
    max_users = Column(Integer, default=5)
    ai_enabled = Column(Boolean, default=False)
    forecasting_enabled = Column(Boolean, default=False)
    oee_enabled = Column(Boolean, default=False)
    advanced_reports_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Operator")
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    industry = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    status = Column(String, default="Active")
    subscription_plan_id = Column(
        Integer,
        ForeignKey("subscription_plans.id"),
        nullable=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    subscription_plan = relationship("SubscriptionPlan")


class UserCompany(Base):
    __tablename__ = "user_companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role = Column(String, default="Member")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    company = relationship("Company")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, default="General")
    unit = Column(String, default="pcs")
    cost_price = Column(Float, default=0)
    selling_price = Column(Float, default=0)
    reorder_level = Column(Float, default=50)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse = Column(String, default="Main Warehouse")
    quantity = Column(Float, default=0)
    reserved_quantity = Column(Float, default=0)
    min_stock = Column(Float, default=50)
    max_stock = Column(Float, default=1000)
    updated_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    product = relationship("Product")


class WorkCenter(Base):
    __tablename__ = "work_centers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="Running")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    order_number = Column(String, unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=True)
    target_quantity = Column(Float, nullable=False)
    produced_quantity = Column(Float, default=0)
    priority = Column(String, default="Normal")
    status = Column(String, default="Planned")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    product = relationship("Product")
    work_center = relationship("WorkCenter")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    quantity_produced = Column(Float, nullable=False)
    operator_name = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    production_order = relationship("ProductionOrder")


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    check_type = Column(String, nullable=False)
    result = Column(String, default="Pass")
    inspector_name = Column(String, nullable=False)
    defects_count = Column(Float, default=0)
    corrective_action = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    production_order = relationship("ProductionOrder")


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    recorded_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    product = relationship("Product")


class DowntimeRecord(Base):
    __tablename__ = "downtime_records"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)
    reason = Column(String, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    recorded_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    work_center = relationship("WorkCenter")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, default=0)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    supplier = relationship("Supplier")
    product = relationship("Product")


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, default=0)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    customer = relationship("Customer")
    product = relationship("Product")


class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="Normal")
    status = Column(String, default="Open")
    assigned_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    work_center = relationship("WorkCenter")


class BatchTrace(Base):
    __tablename__ = "batch_traces"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, default=1)
    batch_number = Column(String, unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    status = Column(String, default="Active")
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    product = relationship("Product")
    supplier = relationship("Supplier")


class ProductionSchedule(Base):
    __tablename__ = "production_schedules"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=True)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=True)

    schedule_date = Column(Date, nullable=False)
    shift = Column(String, default="Morning")
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    priority = Column(String, default="Normal")
    status = Column(String, default="Planned")
    capacity_load = Column(Float, default=0)

    assigned_operator = Column(String, nullable=True)
    material_status = Column(String, default="Unchecked")
    conflict_status = Column(String, default="Clear")
    schedule_type = Column(String, default="Manual")

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("ProductionOrder")
    work_center = relationship("WorkCenter")