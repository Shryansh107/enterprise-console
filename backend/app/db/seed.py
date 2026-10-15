import random
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

    print("Seeding database with modern design icons and 1,000+ bulk entries...")

    # 1. Base Products (Modernist Design Classics & Equipment)
    base_products = [
        ("Bauhaus Armchair", "FURN", 850.00, 12),
        ("Monochrome Notebook", "STAT", 24.00, 150),
        ("StarkDesk Lamp", "LIGHT", 180.00, 4),
        ("Brutalist Teapot", "KITCH", 95.00, 0),
        ("Serif Typography Poster", "ART", 45.00, 75),
        ("Helvetica Bold Monograph", "BOOK", 65.00, 22),
        ("Eames Lounge Chair", "FURN", 4500.00, 3),
        ("Artek Stool 60", "FURN", 290.00, 18),
        ("Braun ET66 Calculator", "TECH", 150.00, 8),
        ("Akari 1A Light Sculpture", "LIGHT", 350.00, 0),
        ("Noguchi Coffee Table", "FURN", 1890.00, 6),
        ("Sacco Bean Bag Chair", "FURN", 420.00, 15),
        ("Tizio Artemide Lamp", "LIGHT", 470.00, 2),
        ("Olivetti Valentine Typewriter", "TECH", 680.00, 5),
        ("Moka Express Espresso Maker", "KITCH", 40.00, 200),
        ("AeroPress Coffee Brew Kit", "KITCH", 35.00, 120),
        ("Fiske Typography Specimen", "BOOK", 38.00, 40),
    ]

    products = []
    # Add base products first
    for i, (name, category, price, qty) in enumerate(base_products):
        products.append(Product(name=name, sku=f"{category}-{i+1:03d}", price=price, quantity_in_stock=qty))
        
    # Generate bulk products to reach over 1,000 products
    categories = ["FURN", "LIGHT", "KITCH", "ART", "BOOK", "TECH", "STAT"]
    adjectives = ["Minimalist", "Industrial", "Organic", "Modernist", "Modular", "Brutalist", "Ergonomic", "Functional"]
    nouns = ["Desk", "Shelving", "Sconce", "Vase", "Organizer", "Clock", "Organizer", "Carafe", "Grid Framed Print"]
    
    for i in range(len(base_products), 1020):
        category = categories[i % len(categories)]
        adj = adjectives[(i * 3) % len(adjectives)]
        noun = nouns[(i * 7) % len(nouns)]
        name = f"{adj} {noun} Model {i}"
        sku = f"{category}-{i+1:03d}"
        price = round(15.0 + (i * 7.5) % 1200.0, 2)
        qty = (i * 4) % 180
        products.append(Product(name=name, sku=sku, price=price, quantity_in_stock=qty))

    for p in products:
        db.add(p)
    db.commit()

    # 2. Base Customers (Iconic Modern Designers & Architects)
    base_customers = [
        ("Dieter Rams", "dieter@vitsoe.com", "+49 171 1234567"),
        ("Charlotte Perriand", "charlotte@cassina.fr", "+33 6 12345678"),
        ("Zaha Hadid", "zaha@hadid-architects.com", "+44 20 76543210"),
        ("Le Corbusier", "corbusier@atelier.ch", "+41 22 9876543"),
        ("Florence Knoll", "florence@knoll.com", "+1 212 555 0199"),
        ("Verner Panton", "verner@panton-design.dk", "+45 33 112233"),
        ("Eileen Gray", "eileen@gray-studios.fr", "+33 1 45678901"),
    ]

    customers = []
    for full_name, email, phone in base_customers:
        customers.append(Customer(full_name=full_name, email=email, phone_number=phone))
        
    # Generate bulk customers to reach over 1,000 customers
    first_names = ["Lars", "Alvar", "Finn", "Arne", "Gerrit", "Marcel", "Mies", "Walter", "Renzo", "Zaha", "Charlotte", "Dieter", "Hella", "Patricia"]
    last_names = ["Aalto", "Jacobsen", "Rietveld", "Breuer", "Rohe", "Gropius", "Piano", "Foster", "Starck", "Noguchi", "Sapper", "Jongerius", "Urquiola"]
    
    for i in range(len(base_customers), 1020):
        first_name = first_names[i % len(first_names)]
        last_name = last_names[(i * 3) % len(last_names)]
        full_name = f"{first_name} {last_name} {i}"
        email = f"{first_name.lower()}.{last_name.lower()}{i}@design-matrix.org"
        phone = f"+44 7700 900{i:03d}"
        customers.append(Customer(full_name=full_name, email=email, phone_number=phone))

    for c in customers:
        db.add(c)
    db.commit()

    # Refresh models to load IDs
    for p in products:
        db.refresh(p)
    for c in customers:
        db.refresh(c)

    # 3. Create Orders (using transactional deductions)
    # Generate over 1,000 orders
    random.seed(42) # Fixed seed to make database seeding deterministic
    
    print("Generating 1,000+ order logs transactional commits...")
    for i in range(1020):
        customer = customers[i % len(customers)]
        
        # Determine 1 to 3 items per order
        num_items = (i % 3) + 1
        items = []
        for j in range(num_items):
            prod = products[(i * 11 + j * 17) % len(products)]
            
            # Replenish stock if empty so the transaction succeeds
            if prod.quantity_in_stock < 2:
                prod.quantity_in_stock += 15
                db.add(prod)
                db.commit()
                db.refresh(prod)
                
            items.append(OrderItemCreate(product_id=prod.id, quantity=1))
            
        order_in = OrderCreate(customer_id=customer.id, items=items)
        try:
            create_order(db, order_in)
        except Exception as e:
            # Rollback active failed txn and skip to keep seed running
            db.rollback()
            continue
            
    print("Database bulk seed committed successfully.")
