from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models.user import User, UserRole
from backend.models.user_activity import UserActivity
from backend.schemas.user import UserCreate, UserUpdate, UserResponse, UserActivityResponse
from backend.services.auth import get_current_active_admin, get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Listar todos los usuarios (solo admin)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Crear usuario (solo admin)"""
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Actualizar perfil de usuario (role, email, username)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.username:
        user.username = user_update.username
    if user_update.email:
        user.email = user_update.email
    if user_update.role:
        user.role = user_update.role
    # Password change is handled separately or can be here if provided
    if user_update.password:
        user.hashed_password = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}/activity", response_model=List[UserActivityResponse])
def read_user_activity(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Ver historial de accesos de un usuario"""
    activities = db.query(UserActivity)\
        .filter(UserActivity.user_id == user_id)\
        .order_by(UserActivity.timestamp.desc())\
        .limit(limit)\
        .all()
    return activities
