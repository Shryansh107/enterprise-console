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

    # 1. Add Products (Modenist Design Classics & Equipment)
    products = [
        Product(name="Bauhaus Armchair", sku="FURN-001", price=850.00, quantity_in_stock=12),
        Product(name="Monochrome Notebook", sku="STAT-002", price=24.00, quantity_in_stock=150),
        Product(name="StarkDesk Lamp", sku="LIGHT-003", price=180.00, quantity_in_stock=4),  # Low Stock
        Product(name="Brutalist Teapot", sku="KITCH-004", price=95.00, quantity_in_stock=0),   # Out of Stock
        Product(name="Serif Typography Poster", sku="ART-005", price=45.00, quantity_in_stock=75),
        Product(name="Helvetica Bold Monograph", sku="BOOK-006", price=65.00, quantity_in_stock=22),
        Product(name="Eames Lounge Chair", sku="FURN-007", price=4500.00, quantity_in_stock=3),
        Product(name="Artek Stool 60", sku="FURN-008", price=290.00, quantity_in_stock=18),
        Product(name="Braun ET66 Calculator", sku="TECH-009", price=150.00, quantity_in_stock=8),
        Product(name="Akari 1A Light Sculpture", sku="LIGHT-010", price=350.00, quantity_in_stock=0),  # Out of Stock
        Product(name="Noguchi Coffee Table", sku="FURN-011", price=1890.00, quantity_in_stock=6),
        Product(name="Sacco Bean Bag Chair", sku="FURN-012", price=420.00, quantity_in_stock=15),
        Product(name="Tizio Artemide Lamp", sku="LIGHT-013", price=470.00, quantity_in_stock=2),  # Low Stock
        Product(name="Olivetti Valentine Typewriter", sku="TECH-014", price=680.00, quantity_in_stock=5),
        Product(name="Moka Express Espresso Maker", sku="KITCH-015", price=40.00, quantity_in_stock=200),
        Product(name="AeroPress Coffee Brew Kit", sku="KITCH-016", price=35.00, quantity_in_stock=120),
        Product(name="Fiske Typography Specimen", sku="BOOK-017", price=38.00, quantity_in_stock=40),
    ]
    for p in products:
        db.add(p)
    db.commit()

    # 2. Add Customers (Iconic Modern Designers & Architects)
    customers = [
        Customer(full_name="Dieter Rams", email="dieter@vitsoe.com", phone_number="+49 171 1234567"),
        Customer(full_name="Charlotte Perriand", email="charlotte@cassina.fr", phone_number="+33 6 12345678"),
        Customer(full_name="Zaha Hadid", email="zaha@hadid-architects.com", phone_number="+44 20 76543210"),
        Customer(full_name="Le Corbusier", email="corbusier@atelier.ch", phone_number="+41 22 9876543"),
        Customer(full_name="Florence Knoll", email="florence@knoll.com", phone_number="+1 212 555 0199"),
        Customer(full_name="Verner Panton", email="verner@panton-design.dk", phone_number="+45 33 112233"),
        Customer(full_name="Eileen Gray", email="eileen@gray-studios.fr", phone_number="+33 1 45678901"),
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

        # Zaha Hadid placing an order
        order3 = OrderCreate(
            customer_id=customers[2].id,
            items=[
                OrderItemCreate(product_id=products[6].id, quantity=1),  # Eames Lounge Chair
                OrderItemCreate(product_id=products[8].id, quantity=1),  # Braun ET66 Calculator
            ]
        )
        create_order(db, order3)

        # Florence Knoll placing an order
        order4 = OrderCreate(
            customer_id=customers[4].id,
            items=[
                OrderItemCreate(product_id=products[7].id, quantity=4),   # Artek Stool 60
                OrderItemCreate(product_id=products[10].id, quantity=1),  # Noguchi Coffee Table
            ]
        )
        create_order(db, order4)

        # Le Corbusier placing an order
        order5 = OrderCreate(
            customer_id=customers[3].id,
            items=[
                OrderItemCreate(product_id=products[14].id, quantity=2),  # Moka Express Espresso Maker
                OrderItemCreate(product_id=products[4].id, quantity=1),   # Serif Typography Poster
            ]
        )
        create_order(db, order5)

        # Verner Panton placing an order
        order6 = OrderCreate(
            customer_id=customers[5].id,
            items=[
                OrderItemCreate(product_id=products[11].id, quantity=2),  # Sacco Bean Bag Chair
                OrderItemCreate(product_id=products[13].id, quantity=1),  # Olivetti Valentine Typewriter
            ]
        )
        create_order(db, order6)
        
        print("Database successfully seeded.")
    except Exception as e:
        print(f"Error seeding database orders: {e}")
        db.rollback()
