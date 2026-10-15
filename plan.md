Build a production-ready full-stack Inventory & Order Management System for a technical assessment.

The goal is to create a clean, professional, deployable application that demonstrates solid software engineering fundamentals, not just basic CRUD.

Tech stack requirements:
- Frontend: React (JavaScript)
- Backend: Python with FastAPI
- Database: PostgreSQL
- Containerization: Docker
- Orchestration: Docker Compose
- Version control friendly structure with clear README and environment setup

Core entities:
1. Product
2. Customer
3. Order

Business context:
This app is for a small business that needs to manage products, customers, stock, and orders from one dashboard. The UI should look modern and production-ready, suitable for a real internal operations team.

Functional requirements:

Backend API:
- Product APIs
  - POST /products
  - GET /products
  - GET /products/{id}
  - PUT /products/{id}
  - DELETE /products/{id}

- Customer APIs
  - POST /customers
  - GET /customers
  - GET /customers/{id}
  - DELETE /customers/{id}

- Order APIs
  - POST /orders
  - GET /orders
  - GET /orders/{id}
  - DELETE /orders/{id}

Product fields:
- id
- name
- sku
- price
- quantity_in_stock
- created_at
- updated_at

Customer fields:
- id
- full_name
- email
- phone_number
- created_at

Order fields:
- id
- customer_id
- total_amount
- status
- created_at

Order item fields:
- id
- order_id
- product_id
- quantity
- unit_price
- line_total

Business rules:
- SKU must be unique
- Customer email must be unique
- Product quantity cannot be negative
- Orders cannot be placed if stock is insufficient
- Creating an order must automatically reduce stock
- Total order amount must be calculated by the backend, not trusted from frontend input
- All request bodies must be validated
- Return proper HTTP status codes and useful JSON error messages
- Handle database integrity errors gracefully

Backend implementation requirements:
- Use FastAPI with clear modular structure
- Use SQLAlchemy ORM or SQLModel
- Use Alembic migrations
- Use Pydantic schemas for request/response validation
- Add CORS config for frontend communication
- Include a health endpoint
- Add seed script or startup seed for demo data
- Include centralized error handling
- Use environment variables for configuration
- Add logging for API requests and failures
- Structure backend like:
  - app/main.py
  - app/api/routes/
  - app/models/
  - app/schemas/
  - app/services/
  - app/db/
  - app/core/

Order logic should be implemented in a service layer:
- Validate customer exists
- Validate all products exist
- Validate stock for every item
- Compute each line total
- Compute total order amount
- Decrement stock atomically in one transaction
- Roll back fully on failure

Frontend requirements:
Build a responsive React application with:
- Dashboard
- Products page
- Customers page
- Orders page
- Order detail modal or page
- Clean navigation sidebar/topbar
- Responsive layout for desktop and mobile
- Professional visual design with polished spacing, cards, tables, forms, badges, and feedback states

Frontend features:
- Dashboard cards:
  - total products
  - total customers
  - total orders
  - low stock products
- Product management:
  - add product
  - list products
  - edit product
  - delete product
- Customer management:
  - add customer
  - list customers
  - delete customer
- Order management:
  - create order
  - list orders
  - view order details
  - delete/cancel order

Frontend engineering expectations:
- Use component-based structure
- Use a service/api layer for HTTP calls
- Use React state cleanly; Context API is okay if needed
- Show loading, empty, success, and error states
- Add form validation and inline error messages
- Disable invalid submissions
- Use reusable components where sensible
- Make tables mobile-friendly
- Ensure forms are accessible

UI/UX direction:
- Avoid generic template look
- Use a clean operations-dashboard style
- Neutral base colors with one restrained accent
- Clear hierarchy and spacing
- Make it look like an internal business tool, not a student toy project
- Include confirmation before destructive actions
- Show low-stock products with visual warning badges

Docker requirements:
Create:
- backend/Dockerfile
- frontend/Dockerfile
- .dockerignore files
- docker-compose.yml at root

Docker Compose services:
- frontend
- backend
- db

Docker expectations:
- Use lightweight images
- Backend should wait for database readiness or fail clearly
- Use named volume for PostgreSQL persistence
- No hardcoded secrets
- Use env files and environment variables
- Expose suitable ports for local development
- Frontend should call backend using environment-configured API base URL

Deployment expectations:
Prepare project so it can be deployed on free platforms:
- Backend: Render, Railway, or Fly.io
- Frontend: Vercel or Netlify
- Database: managed Postgres if needed for deployment
- Ensure environment variables are documented
- Ensure CORS and production API URLs are configurable

Output requirements:
Generate the entire project with:
1. Complete backend code
2. Complete frontend code
3. Dockerfiles
4. docker-compose.yml
5. README.md with setup, local run, Docker run, deployment steps, and API summary
6. .env.example files
7. Seed/demo data
8. Clean folder structure

Quality bar:
- Code should be readable and modular
- No placeholder TODOs
- No fake features
- Prefer correctness and polish over unnecessary complexity
- Keep implementation realistic enough to finish and explain in an interview

Nice-to-have enhancements if time permits:
- Search/filter products and customers
- Pagination for lists
- Order status badges
- Low-stock threshold logic
- Simple analytics chart on dashboard
- Created-at timestamps in UI
- Toast notifications
- Optimistic but safe UX updates

Important:
Do not overengineer authentication unless explicitly required.
Focus on strong CRUD, correct business logic, validation, database modeling, Dockerization, and deployment readiness.

Also provide:
- a recommended folder structure first
- then generate backend
- then frontend
- then Docker setup
- then deployment instructions
- then README