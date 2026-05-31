from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.core.errors import EntityNotFoundException

router = APIRouter()


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.full_name.ilike(f"%{search}%")) | 
            (Customer.email.ilike(f"%{search}%"))
        )
    if name:
        query = query.filter(Customer.full_name.ilike(f"%{name}%"))
    if email:
        query = query.filter(Customer.email.ilike(f"%{email}%"))
    if phone:
        query = query.filter(Customer.phone_number.ilike(f"%{phone}%"))
        
    return query.order_by(Customer.full_name).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {customer_id} not found.")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {customer_id} not found.")
    db.delete(customer)
    db.commit()
    return None
