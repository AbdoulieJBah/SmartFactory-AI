from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from config import SECRET_KEY, ALGORITHM
from database import get_db
from models import User, Company, UserCompany

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise credentials_exception

    return user


def get_current_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_company = (
        db.query(UserCompany)
        .filter(UserCompany.user_id == current_user.id)
        .first()
    )

    if not user_company:
        raise HTTPException(
            status_code=403,
            detail="User is not assigned to a company",
        )

    company = (
        db.query(Company)
        .filter(Company.id == user_company.company_id)
        .first()
    )

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return company


def require_roles(*allowed_roles):
    if len(allowed_roles) == 1 and isinstance(allowed_roles[0], list):
        allowed_roles = tuple(allowed_roles[0])

    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Allowed roles: {allowed_roles}",
            )

        return current_user

    return checker


require_super_admin = require_roles("Super Admin")

require_company_admin = require_roles(
    "Super Admin",
    "Company Admin",
)

require_plant_manager = require_roles(
    "Super Admin",
    "Company Admin",
    "Plant Manager",
)

require_production_access = require_roles(
    "Super Admin",
    "Company Admin",
    "Plant Manager",
    "Production Manager",
    "Operator",
)

require_quality_access = require_roles(
    "Super Admin",
    "Company Admin",
    "Plant Manager",
    "Quality Manager",
)

require_inventory_access = require_roles(
    "Super Admin",
    "Company Admin",
    "Plant Manager",
    "Warehouse Manager",
)

require_read_access = require_roles(
    "Super Admin",
    "Company Admin",
    "Plant Manager",
    "Production Manager",
    "Quality Manager",
    "Warehouse Manager",
    "Operator",
    "Viewer",
)