from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from backend.models.user import UserRole


class UserBase(BaseModel):
    """Schema base para usuarios"""
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    role: UserRole = UserRole.SUPERVISOR


class UserCreate(UserBase):
    """Schema para crear usuario"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    """Schema de respuesta de usuario"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema para token de autenticación"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema para datos del token"""
    username: Optional[str] = None
    role: Optional[str] = None
