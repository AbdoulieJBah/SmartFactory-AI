from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import WorkCenter
from schemas import WorkCenterCreate, WorkCenterResponse

router = APIRouter(prefix="/work-centers", tags=["Work Centers"])


@router.post("/", response_model=WorkCenterResponse, status_code=status.HTTP_201_CREATED)
def create_work_center(center: WorkCenterCreate, db: Session = Depends(get_db)):
    new_center = WorkCenter(**center.dict())

    db.add(new_center)
    db.commit()
    db.refresh(new_center)

    return new_center


@router.get("/", response_model=list[WorkCenterResponse])
def get_work_centers(db: Session = Depends(get_db)):
    return db.query(WorkCenter).order_by(WorkCenter.id.desc()).all()


@router.get("/{center_id}", response_model=WorkCenterResponse)
def get_work_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(WorkCenter).filter(WorkCenter.id == center_id).first()

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    return center


@router.put("/{center_id}", response_model=WorkCenterResponse)
def update_work_center(
    center_id: int,
    center_update: WorkCenterCreate,
    db: Session = Depends(get_db)
):
    center = db.query(WorkCenter).filter(WorkCenter.id == center_id).first()

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in center_update.dict().items():
        setattr(center, key, value)

    db.commit()
    db.refresh(center)

    return center


@router.delete("/{center_id}")
def delete_work_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(WorkCenter).filter(WorkCenter.id == center_id).first()

    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    db.delete(center)
    db.commit()

    return {"message": "Work center deleted successfully"}