from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import AuditLog, User
from schemas import AuditLogResponse
from dependencies import require_roles

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Super Admin", "Plant Manager"])
    )
):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).all()