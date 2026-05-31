from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import setup_error_handlers
from app.core.logging import setup_logging
from app.db.session import Base, engine, SessionLocal
from app.db.seed import seed_database
from app.api.routes import products, customers, orders

# Setup global logging configuration
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Database tables creation...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield
    # Shutdown actions (clean up pool, etc. if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up global exception handlers
setup_error_handlers(app)

# Health endpoint
@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "healthy"}


# Mount domain routers
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
