from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import products
from routers import inventory
from routers import production_orders
from routers import production_logs
from routers import work_centers
from routers import quality_checks
from routers import waste_records
from routers import downtime
from routers import suppliers
from routers import customers
from routers import purchase_orders
from routers import sales_orders
from routers import dashboard
from routers import ai
from routers import forecasting
from routers import oee
from routers import notifications
from routers import scheduling
from routers import maintenance
from routers import traceability
from routers import auth
from routers import users
from routers import audit_logs
from routers import companies
from routers import reports
from routers import alerts
from routers import pdf_reports
from routers import excel_exports
from routers import subscriptions

app = FastAPI(
    title="SmartFactory AI",
    description="Commercial-grade AI-powered MES and ERP platform for manufacturing companies",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(audit_logs.router)
app.include_router(companies.router)

app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(production_orders.router)
app.include_router(production_logs.router)
app.include_router(work_centers.router)
app.include_router(quality_checks.router)
app.include_router(waste_records.router)
app.include_router(downtime.router)
app.include_router(suppliers.router)
app.include_router(customers.router)
app.include_router(purchase_orders.router)
app.include_router(sales_orders.router)

app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(forecasting.router)
app.include_router(oee.router)
app.include_router(notifications.router)
app.include_router(scheduling.router)
app.include_router(maintenance.router)
app.include_router(traceability.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(pdf_reports.router)
app.include_router(excel_exports.router)
app.include_router(
    subscriptions.router
)


@app.get("/")
def root():
    return {
        "message": "SmartFactory AI Backend Running",
        "version": "1.0.0",
        "modules": [
            "Authentication",
            "Users",
            "Audit Logs",
            "Companies",
            "Products",
            "Inventory",
            "Production Orders",
            "Production Logs",
            "Work Centers",
            "Quality Checks",
            "Waste Records",
            "Downtime",
            "Suppliers",
            "Customers",
            "Purchase Orders",
            "Sales Orders",
            "Dashboard",
            "AI Copilot",
            "Forecasting",
            "OEE",
            "Notifications",
            "Scheduling",
            "Maintenance",
            "Traceability",
            "Reports",
            "Alerts",
        ],
    }