from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.plan import Plan
from backend.services.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/plans",
    tags=["plans"],
    responses={404: {"description": "Not found"}},
)

class PlanSchema(BaseModel):
    id: int
    nombre: str
    costo_mensual: float
    descripcion: str | None = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PlanSchema])
def read_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todos los planes"""
    return db.query(Plan).all()
