from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate
from app.core.errors import EntityNotFoundException, InsufficientStockException


def create_order(db: Session, order_in: OrderCreate) -> Order:
    """
    Creates an order, validates customer and product availability, 
    calculates pricing, and decrements inventory in a transaction-safe manner.
    """
    try:
        # 1. Validate customer exists
        customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
        if not customer:
            raise EntityNotFoundException(f"Customer with ID {order_in.customer_id} does not exist.")

        db_items = []
        total_amount = 0.0

        # Group duplicate product IDs in the order request to prevent multiple checks
        item_quantities = {}
        for item in order_in.items:
            item_quantities[item.product_id] = item_quantities.get(item.product_id, 0) + item.quantity

        # 2. Validate products and stock
        for product_id, quantity in item_quantities.items():
            # with_for_update() locks the selected product row for updates
            product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
            if not product:
                raise EntityNotFoundException(f"Product with ID {product_id} does not exist.")

            if product.quantity_in_stock < quantity:
                raise InsufficientStockException(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity_in_stock}, Requested: {quantity}."
                )

            # Deduct stock
            product.quantity_in_stock -= quantity

            # Create OrderItem entry
            line_total = product.price * quantity
            total_amount += line_total

            db_item = OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
                line_total=line_total
            )
            db_items.append(db_item)

        # 3. Create the Order object
        db_order = Order(
            customer_id=customer.id,
            total_amount=round(total_amount, 2),
            status=order_in.status or "completed",
            items=db_items
        )

        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    except Exception as e:
        db.rollback()
        raise e


def cancel_order(db: Session, order_id: int) -> Order:
    """
    Cancels/Deletes an order, and replenishes the stock.
    """
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise EntityNotFoundException(f"Order with ID {order_id} does not exist.")

        # Replenish stock
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity

        db.delete(order)
        db.commit()
        return order
    except Exception as e:
        db.rollback()
        raise e
