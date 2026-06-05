from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Product
from schemas import ProductCreate, ProductResponse

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_product = Product(
        sku=product.sku,
        name=product.name,
        description=product.description,
        unit=product.unit
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()