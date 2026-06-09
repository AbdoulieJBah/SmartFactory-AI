from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_roles
from models import Company, User, UserCompany
from schemas import CompanyCreate, CompanyResponse, UserCompanyCreate, UserCompanyResponse

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin"])),
):
    existing = db.query(Company).filter(Company.name == company.name).first()

    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")

    new_company = Company(**company.dict())

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return new_company


@router.get("/", response_model=list[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
):
    return db.query(Company).order_by(Company.id.desc()).all()


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return company


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_update: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin"])),
):
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for key, value in company_update.dict().items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)

    return company


@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin"])),
):
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(company)
    db.commit()

    return {"message": "Company deleted successfully"}


@router.post("/assign-user", response_model=UserCompanyResponse)
def assign_user_to_company(
    assignment: UserCompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin"])),
):
    user = db.query(User).filter(User.id == assignment.user_id).first()
    company = db.query(Company).filter(Company.id == assignment.company_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing = (
        db.query(UserCompany)
        .filter(
            UserCompany.user_id == assignment.user_id,
            UserCompany.company_id == assignment.company_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="User already assigned to company")

    new_assignment = UserCompany(**assignment.dict())

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment


@router.get("/assignments/all", response_model=list[UserCompanyResponse])
def get_user_company_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "Plant Manager"])),
):
    return db.query(UserCompany).order_by(UserCompany.id.desc()).all()