from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import AssessmentHistoryRequest, AssessmentHistoryResponse
from services.assessment_history_service import assessment_history_service

router = APIRouter()


@router.post("/save", response_model=AssessmentHistoryResponse)
def save_assessment(request: AssessmentHistoryRequest, db: Session = Depends(get_db)):
    return assessment_history_service.save_assessment(request, db)


@router.post("/list", response_model=AssessmentHistoryResponse)
def fetch_assessment_history(request: AssessmentHistoryRequest, db: Session = Depends(get_db)):
    return assessment_history_service.get_assessment_history(request, db)
