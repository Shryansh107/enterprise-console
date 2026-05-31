from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.order_service import create_order


def seed_database(db: Session) -> None:
    # Check if database is already seeded
    if db.query(Product).count() > 0:
        return

    print("Seeding database with modern design icons...")

    # 1. Add Products
    products = [
        Product(name="Bauhaus Armchair", sku="FURN-001", price=850.00, quantity_in_stock=12),
        Product(name="Monochrome Notebook", sku="STAT-002", price=24.00, quantity_in_stock=150),
        Product(name="StarkDesk Lamp", sku="LIGHT-003", price=180.00, quantity_in_stock=4),  # Low Stock
        Product(name="Brutalist Teapot", sku="KITCH-004", price=95.00, quantity_in_stock=0),   # Out of Stock
        Product(name="Serif Typography Poster", sku="ART-005", price=45.00, quantity_in_stock=75),
        Product(name="Helvetica Bold Monograph", sku="BOOK-006", price=65.00, quantity_in_stock=22),
    ]
    for p in products:
        db.add(p)
    db.commit()

    # 2. Add Customers
    customers = [
        Customer(full_name="Dieter Rams", email="dieter@vitsoe.com", phone_number="+49 171 1234567"),
        Customer(full_name="Charlotte Perriand", email="charlotte@cassina.fr", phone_number="+33 6 12345678"),
        Customer(full_name="Zaha Hadid", email="zaha@hadid-architects.com", phone_number="+44 20 76543210"),
    ]
    for c in customers:
        db.add(c)
    db.commit()

    # Refresh models to get IDs
    for p in products:
        db.refresh(p)
    for c in customers:
        db.refresh(c)

    # 3. Create Orders (using service for transactional deduction)
    try:
        # Dieter Rams placing an order
        order1 = OrderCreate(
            customer_id=customers[0].id,
            items=[
                OrderItemCreate(product_id=products[0].id, quantity=1),  # Bauhaus Armchair
                OrderItemCreate(product_id=products[1].id, quantity=3),  # Monochrome Notebook
            ]
        )
        create_order(db, order1)

        # Charlotte Perriand placing an order
        order2 = OrderCreate(
            customer_id=customers[1].id,
            items=[
                OrderItemCreate(product_id=products[2].id, quantity=1),  # StarkDesk Lamp
                OrderItemCreate(product_id=products[4].id, quantity=2),  # Serif Typography Poster
            ]
        )
        create_order(db, order2)
        
        print("Database successfully seeded.")
    except Exception as e:
        print(f"Error seeding database orders: {e}")
        db.rollback()
