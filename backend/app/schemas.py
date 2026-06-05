from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    unit: str = "pcs"

class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True