import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from database import engine
from models import Base
from rate_limit import limiter

# Schema changes now go through Alembic (see backend/migrations/). This
# create_all is kept only as a safety net so a brand-new, empty database
# still boots without anyone having to run migrations by hand; it is a
# no-op against a database whose tables already exist.
Base.metadata.create_all(bind=engine)

from routers import (
    auth,
    users,
    audit_logs,
    companies,
    products,
    inventory,
    suppliers,
    customers,
    production_orders,
    production_logs,
    purchase_orders,
    sales_orders,
    work_centers,
    quality_checks,
    waste_records,
    downtime,
    maintenance,
    traceability,
    dashboard,
    reports,
    alerts,
    ai,
    forecasting,
    notifications,
    scheduling,
    oee,
    pdf_reports,
    excel_exports,
    subscriptions,
)

app = FastAPI(
    title="SmartFactory AI",
    description="Commercial-grade AI-powered MES and ERP platform for manufacturing companies",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://smart-factory-ai-seven.vercel.app",
    "https://smart-factory-ai-git-main-abdouliejbahs-projects.vercel.app",
    "https://smart-factory-7esait8ce-abdouliejbahs-projects.vercel.app",
    "https://smart-factory-ai-kappa.vercel.app",
]

_cors_env = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = (
    [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
    if _cors_env
    else DEFAULT_CORS_ORIGINS
)

# Vercel preview deployments get a new URL per branch/PR; allow any
# *.vercel.app subdomain in addition to the explicit allowlist above so new
# previews don't require a redeploy just to fix CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
app.include_router(subscriptions.router)


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
            "PDF Reports",
            "Excel Exports",
            "Subscriptions",
        ],
    }