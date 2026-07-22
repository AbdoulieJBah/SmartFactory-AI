from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    module: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    status: str = "Active"


class CompanyResponse(CompanyCreate):
    id: int

    class Config:
        from_attributes = True


class UserCompanyCreate(BaseModel):
    user_id: int
    company_id: int
    role: str = "Member"


class UserCompanyResponse(UserCompanyCreate):
    id: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: str = "General"
    unit: str = "pcs"
    cost_price: float = 0
    selling_price: float = 0
    reorder_level: float = 50
    status: str = "Active"


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True


class InventoryCreate(BaseModel):
    product_id: int
    warehouse: str = "Main Warehouse"
    quantity: float
    reserved_quantity: float = 0
    min_stock: float = 50
    max_stock: float = 1000


class InventoryResponse(InventoryCreate):
    id: int

    class Config:
        from_attributes = True


class WorkCenterCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "Running"


class WorkCenterResponse(WorkCenterCreate):
    id: int

    class Config:
        from_attributes = True


class ProductionOrderCreate(BaseModel):
    order_number: str
    product_id: int
    work_center_id: Optional[int] = None
    target_quantity: float
    produced_quantity: float = 0
    priority: str = "Normal"
    status: str = "Planned"


class ProductionOrderResponse(ProductionOrderCreate):
    id: int

    class Config:
        from_attributes = True


class ProductionLogCreate(BaseModel):
    production_order_id: int
    quantity_produced: float
    operator_name: str
    notes: Optional[str] = None


class ProductionLogResponse(ProductionLogCreate):
    id: int

    class Config:
        from_attributes = True


class QualityCheckCreate(BaseModel):
    production_order_id: int
    check_type: str
    result: str = "Pass"
    inspector_name: str
    defects_count: float = 0
    corrective_action: Optional[str] = None
    notes: Optional[str] = None


class QualityCheckResponse(QualityCheckCreate):
    id: int

    class Config:
        from_attributes = True


class WasteRecordCreate(BaseModel):
    product_id: int
    quantity: float
    reason: str
    recorded_by: str


class WasteRecordResponse(WasteRecordCreate):
    id: int

    class Config:
        from_attributes = True


class DowntimeCreate(BaseModel):
    work_center_id: int
    reason: str
    duration_minutes: float
    recorded_by: str


class DowntimeResponse(DowntimeCreate):
    id: int

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"


class SupplierResponse(SupplierCreate):
    id: int

    class Config:
        from_attributes = True


class CustomerCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"


class CustomerResponse(CustomerCreate):
    id: int

    class Config:
        from_attributes = True


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    product_id: int
    quantity: float
    unit_price: float = 0
    status: str = "Pending"


class PurchaseOrderResponse(PurchaseOrderCreate):
    id: int

    class Config:
        from_attributes = True


class SalesOrderCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity: float
    unit_price: float = 0
    status: str = "Pending"


class SalesOrderResponse(SalesOrderCreate):
    id: int

    class Config:
        from_attributes = True


class MaintenanceCreate(BaseModel):
    work_center_id: int
    title: str
    description: Optional[str] = None
    priority: str = "Normal"
    status: str = "Open"
    assigned_to: Optional[str] = None


class MaintenanceResponse(MaintenanceCreate):
    id: int

    class Config:
        from_attributes = True


class BatchTraceCreate(BaseModel):
    batch_number: str
    product_id: int
    supplier_id: Optional[int] = None
    quantity: float
    status: str = "Active"
    notes: Optional[str] = None


class BatchTraceResponse(BatchTraceCreate):
    id: int

    class Config:
        from_attributes = True


class ProductionScheduleBase(BaseModel):
    order_id: Optional[int] = None
    work_center_id: Optional[int] = None
    schedule_date: date
    shift: str = "Morning"
    start_time: str
    end_time: str
    priority: str = "Normal"
    status: str = "Planned"
    capacity_load: float = 0
    assigned_operator: Optional[str] = None
    material_status: str = "Unchecked"
    conflict_status: str = "Clear"
    schedule_type: str = "Manual"
    notes: Optional[str] = None


class ProductionScheduleCreate(ProductionScheduleBase):
    pass


class ProductionScheduleUpdate(BaseModel):
    order_id: Optional[int] = None
    work_center_id: Optional[int] = None
    schedule_date: Optional[date] = None
    shift: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    capacity_load: Optional[float] = None
    assigned_operator: Optional[str] = None
    material_status: Optional[str] = None
    conflict_status: Optional[str] = None
    schedule_type: Optional[str] = None
    notes: Optional[str] = None


class ProductionScheduleResponse(ProductionScheduleBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True
