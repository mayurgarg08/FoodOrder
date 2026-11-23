# 🍽️ Online Food Ordering System

> A full-stack food ordering application built with **Angular 17**, **ASP.NET Core 8 Web API**, and **SQL Server**, containerized with **Docker**.

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Angular Frontend (Port 4200/80)         │
│     Bootstrap 5 · TypeScript · JWT Auth          │
└──────────────────┬──────────────────────────────┘
                   │ REST API (HTTP/JSON)
┌──────────────────▼──────────────────────────────┐
│       ASP.NET Core Web API (Port 5000)           │
│   Controllers · Services · Repositories · EF     │
└──────────────────┬──────────────────────────────┘
                   │ Entity Framework Core
┌──────────────────▼──────────────────────────────┐
│          SQL Server 2022 (Port 1433)             │
│     Identity · Migrations · Seed Data            │
└──────────────────────────────────────────────────┘
```

## Features

### Customer
- Browse food items with search & category filter
- Add items to cart with quantity management
- Checkout with delivery address
- View order history with status tracking
- Invoice generation per order

### Admin
- Dashboard with stats (orders, revenue, items)
- Full CRUD for food items with image upload
- Category management with inline editing
- Order status management workflow

### Authentication
- JWT-based authentication
- Role-based access (Admin/Customer)
- Route guards & HTTP interceptors
- Password reset flow

## Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd FoodOrderingSystem

# 2. Set environment variables
cp .env.development .env

# 3. Start all containers
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:4200
# API Swagger: http://localhost:5000/swagger
# SQL Server: localhost,1433 (sa / FoodApp@Dev123)
```

## Default Credentials

| Role     | Email                | Password     |
|----------|---------------------|--------------|
| Admin    | admin@foodapp.com   | Admin@123    |
| Customer | customer@foodapp.com | Customer@123 |

## Razorpay Test Mode

Checkout supports Cash on Delivery and Razorpay Standard Checkout. Razorpay uses test credentials only; configure them on the API server and never put the key secret in the Angular app or source control.

For local PowerShell development, set the Razorpay test keys before starting the API:

```powershell
$env:Razorpay__KeyId = "rzp_test_your_key_id"
$env:Razorpay__KeySecret = "your_test_key_secret"
dotnet run
```

The storefront, invoices, and Razorpay use Indian rupees (INR). Existing USD catalog, order, and invoice amounts are converted once by the `ConvertUsdAmountsToInr` migration at 1 USD = 92.68 INR, rounded to the nearest rupee. The seeded menu prices are maintained as explicit INR prices. Razorpay order creation, server-side signature verification, and captured-payment checks are performed by the API.

## Local Development (Without Docker)

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- SQL Server (local or Docker)

### Backend
```bash
cd src/FoodOrdering.API
dotnet restore
dotnet ef database update  # Apply migrations
dotnet run                 # Starts on http://localhost:5000
```

### Frontend
```bash
cd src/FoodOrdering.Frontend
npm install
ng serve                   # Starts on http://localhost:4200
```

## API Endpoints

| Method | Endpoint                    | Auth      | Description              |
|--------|----------------------------|-----------|--------------------------|
| POST   | /api/auth/register         | Public    | Register new customer    |
| POST   | /api/auth/login            | Public    | Login & get JWT token    |
| POST   | /api/auth/forgot-password  | Public    | Request password reset   |
| GET    | /api/food                  | Public    | List all food items      |
| GET    | /api/food/{id}             | Public    | Get food by ID           |
| POST   | /api/food                  | Admin     | Create food item         |
| PUT    | /api/food/{id}             | Admin     | Update food item         |
| DELETE | /api/food/{id}             | Admin     | Delete food item         |
| GET    | /api/category              | Public    | List categories          |
| GET    | /api/cart                  | Auth      | Get user's cart          |
| POST   | /api/cart/add              | Auth      | Add item to cart         |
| DELETE | /api/cart/remove/{id}      | Auth      | Remove cart item         |
| POST   | /api/order/place           | Auth      | Place order from cart    |
| GET    | /api/order/my-orders       | Auth      | User's order history     |
| GET    | /api/order/all             | Admin     | All orders               |
| PUT    | /api/order/{id}/status     | Admin     | Update order status      |
| GET    | /api/order/{id}/invoice    | Auth      | Get order invoice        |
| GET    | /api/health                | Public    | Health check             |

## Production Deployment

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Tech Stack

- **Frontend**: Angular 17, Bootstrap 5, TypeScript, ngx-toastr
- **Backend**: ASP.NET Core 8, Entity Framework Core, ASP.NET Identity
- **Database**: SQL Server 2022
- **Auth**: JWT Bearer tokens
- **DevOps**: Docker, Docker Compose, Azure DevOps Pipelines
- **Web Server**: Nginx (production)
