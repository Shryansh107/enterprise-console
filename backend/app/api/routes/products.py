from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.errors import EntityNotFoundException

router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Integrity errors will be handled gracefully by integrity_error_handler
    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = None,
    sku: Optional[str] = None,
    name: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_stock: Optional[int] = None,
    max_stock: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    if sku:
        query = query.filter(Product.sku.ilike(f"%{sku}%"))
    if name:
        query = query.filter(Product.name.ilike(f"%{name}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_stock is not None:
        query = query.filter(Product.quantity_in_stock >= min_stock)
    if max_stock is not None:
        query = query.filter(Product.quantity_in_stock <= max_stock)
        
    return query.order_by(Product.name).offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product_in: ProductUpdate, 
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    db.delete(product)
    db.commit()
    return None
