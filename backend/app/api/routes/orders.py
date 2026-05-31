from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import cast, String
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderResponse
from app.services import order_service
from app.core.errors import EntityNotFoundException

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # Call safe transaction-based service
    order = order_service.create_order(db, order_in)
    
    # Reload with joined options to return full relations
    return db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order.id).first()


@router.get("/", response_model=List[OrderResponse])
def get_orders(
    txn_id: Optional[str] = None,
    customer_name: Optional[str] = None,
    customer_email: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Order).join(Customer, Order.customer_id == Customer.id, isouter=True)
    
    if txn_id:
        cleaned_id = txn_id.lower().replace("#trx-", "").replace("trx-", "").strip()
        if cleaned_id.isdigit():
            query = query.filter(Order.id == int(cleaned_id))
        else:
            query = query.filter(cast(Order.id, String).ilike(f"%{cleaned_id}%"))
            
    if customer_name:
        query = query.filter(Customer.full_name.ilike(f"%{customer_name}%"))
        
    if customer_email:
        query = query.filter(Customer.email.ilike(f"%{customer_email}%"))
        
    if min_amount is not None:
        query = query.filter(Order.total_amount >= min_amount)
        
    if max_amount is not None:
        query = query.filter(Order.total_amount <= max_amount)

    return query.options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise EntityNotFoundException(f"Order with ID {order_id} not found.")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order_service.cancel_order(db, order_id)
    return None
