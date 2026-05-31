# Ethara AI — Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System for managing products, customers, orders, and stock tracking. The application comprises a modular, transaction-safe Python FastAPI backend and a responsive React frontend client.

---

## ⚡ Core Features

### ⚙️ Python Backend API (FastAPI)
- **Offset-Based Data Pagination:** Serves data entries using limit/skip offsets to guarantee quick server response times.
- **Multi-Column Database Filtering:** Supports database-level filtering across SKUs, name, price range, stock levels, transaction parameters, and customer attributes.
- **Atomic Transaction Order Engine:** Validates all customers and product availability in a single database transaction, with atomic stock deduction and clean rollbacks.
- **Centralized Exception Shielding & Scalability:** Built-in middleware catches duplicate SKUs or emails gracefully and returns explicit error codes, ensuring system reliability.

### 💻 React Frontend (Vite)
- **List Virtualization & Infinite Scroll:** Implements `IntersectionObserver` virtualization for smooth list rendering of extensive datasets.
- **Backend-Driven Query Filtering:** Connects frontend search and tabular column filters directly to query parameters for backend execution.
- **Real-Time Operations Dashboard:** Reports metrics for total products, customer profiles, order history counts, and warning thresholds.
- **Fluid Responsive User Interface:** Adapts layout structures between a sidebar view on desktop viewports and drawer panels on mobile resolutions.

## 📁 Repository Structure
```
/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/routes/       # Product, Customer, and Order endpoints
│   │   ├── core/             # Central configs, custom exceptions, and logging
│   │   ├── db/               # PostgreSQL session engines and data seeding
│   │   ├── models/           # SQLAlchemy Declarative Models
│   │   └── schemas/          # Pydantic input/output schemas
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Multi-stage lightweight python build
│
├── frontend/                 # React client (Vite + JavaScript)
│   ├── src/
│   │   ├── components/       # Custom monochrome components
│   │   ├── services/         # API HTTP request gateways
│   │   ├── App.jsx           # Main Dashboard and CRUD controller
│   │   ├── index.css         # Styling system & design tokens
│   │   └── main.jsx          # React renderer
│   ├── index.html            # Main markup and custom font link headers
│   ├── package.json          # Node dependencies and scripts
│   └── Dockerfile            # Lightweight Node server configuration
│
├── docker-compose.yml        # Multi-container compose orchestrator
├── .env.example              # Environment variables template
└── README.md                 # Complete system manual (this file)
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.
- (Optional for local execution) [Python 3.11+](https://www.python.org/) and [Node.js 20+](https://nodejs.org/).

---

### Method A: Running with Docker (Recommended)
This approach sets up Postgres, compiles the React assets, prepares the FastAPI server, and seeds the database automatically in one step. You can choose to run it using the pre-built Docker Hub images or build it locally from source.

1. **Clone the repository and copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Run Option 1: Using Pre-built Docker Hub Images (Easiest)**
   Pull and run the pre-built backend (`shryansh/ethara-backend:latest`) and frontend (`shryansh/ethara-frontend:latest`) images directly:
   ```bash
   docker compose pull
   docker compose up
   ```

3. **Run Option 2: Build locally from source**
   Build the images locally and start the containers:
   ```bash
   docker compose up --build
   ```

4. **Access the applications:**
   - **Frontend Interface:** [http://localhost:5173](http://localhost:5173)
   - **FastAPI Core Service:** [http://localhost:8000](http://localhost:8000)
   - **Interactive API Documentation (Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🛠️ Building & Pushing Images to Docker Hub
If you want to rebuild the custom backend/frontend Docker images and push them to Docker Hub yourself:

1. **Log in to Docker Hub:**
   ```bash
   docker login
   ```

2. **Build and Tag the Images:**
   ```bash
   # Build the backend
   docker build -t shryansh/ethara-backend:latest ./backend

   # Build the frontend
   docker build -t shryansh/ethara-frontend:latest ./frontend
   ```

3. **Push the Images:**
   ```bash
   # Push the backend
   docker push shryansh/ethara-backend:latest

   # Push the frontend
   docker push shryansh/ethara-frontend:latest
   ```



## 🛠️ API Endpoint Summary

### Products
- `POST /api/products/` - Register a new SKU
- `GET /api/products/` - Retrieve inventory catalog (supports `?search=...`)
- `GET /api/products/{id}` - Fetch a single SKU detail
- `PUT /api/products/{id}` - Edit product price, name, or stock quantity
- `DELETE /api/products/{id}` - Remove a product from the database

### Customers
- `POST /api/customers/` - Register a new client
- `GET /api/customers/` - Retrieve registered customers list (supports `?search=...`)
- `GET /api/customers/{id}` - Fetch customer data
- `DELETE /api/customers/{id}` - Cascade delete customer and orders

### Orders
- `POST /api/orders/` - Place a safe order transaction (atomic inventory decrement & rollback on failure)
- `GET /api/orders/` - Retrieve sales transaction history
- `GET /api/orders/{id}` - View order items list, quantities, and line totals
- `DELETE /api/orders/{id}` - Cancel an order and replenish inventory back to catalog

### System
- `GET /api/health` - Retrieve system health status


