from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_company_admin
from models import Company, SubscriptionPlan, User, UserCompany

router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscriptions"]
)


@router.get("/plans")
def get_plans(
    db: Session = Depends(get_db),
):
    return db.query(
        SubscriptionPlan
    ).all()


@router.post("/assign/{company_id}/{plan_id}")
def assign_plan(
    company_id: int,
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_company_admin
    ),
):
    if current_user.role != "Super Admin":
        owns_company = (
            db.query(UserCompany)
            .filter(
                UserCompany.user_id == current_user.id,
                UserCompany.company_id == company_id,
            )
            .first()
        )

        if not owns_company:
            raise HTTPException(
                status_code=403,
                detail="You can only manage the subscription for your own company",
            )

    company = db.query(
        Company
    ).filter(
        Company.id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    plan = db.query(
        SubscriptionPlan
    ).filter(
        SubscriptionPlan.id == plan_id
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    company.subscription_plan_id = plan.id

    db.commit()

    return {
        "message": "Plan assigned successfully"
    }