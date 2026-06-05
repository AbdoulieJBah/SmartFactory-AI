from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Operator")
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    unit = Column(String, default="pcs")
    created_at = Column(DateTime, default=datetime.utcnow)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, default=0)
    location = Column(String, default="Main Warehouse")
    updated_at = Column(DateTime, default=datetime.utcnow)


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    target_quantity = Column(Float, nullable=False)
    produced_quantity = Column(Float, default=0)
    status = Column(String, default="Planned")
    start_date = Column(DateTime)
    end_date = Column(DateTime)