from database import SessionLocal
from models import SubscriptionPlan

db = SessionLocal()

plans = [
    {
        "name": "Starter",
        "monthly_price": 49,
        "max_users": 5,
        "ai_enabled": False,
        "forecasting_enabled": False,
        "oee_enabled": True,
        "advanced_reports_enabled": False,
    },
    {
        "name": "Professional",
        "monthly_price": 149,
        "max_users": 25,
        "ai_enabled": True,
        "forecasting_enabled": True,
        "oee_enabled": True,
        "advanced_reports_enabled": True,
    },
    {
        "name": "Enterprise",
        "monthly_price": 499,
        "max_users": 999,
        "ai_enabled": True,
        "forecasting_enabled": True,
        "oee_enabled": True,
        "advanced_reports_enabled": True,
    },
]

for plan in plans:
    existing = db.query(
        SubscriptionPlan
    ).filter(
        SubscriptionPlan.name == plan["name"]
    ).first()

    if not existing:
        db.add(
            SubscriptionPlan(**plan)
        )

db.commit()

print("Plans created")