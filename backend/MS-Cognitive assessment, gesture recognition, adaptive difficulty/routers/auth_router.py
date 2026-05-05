from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import AuthRequest, AuthResponse
from services.auth_service import auth_service

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
def login(auth_request: AuthRequest, db: Session = Depends(get_db)):
    return auth_service.login(auth_request, db)


@router.post("/signup", response_model=AuthResponse)
def sign_up(auth_request: AuthRequest, db: Session = Depends(get_db)):
    return auth_service.sign_up(auth_request, db)
