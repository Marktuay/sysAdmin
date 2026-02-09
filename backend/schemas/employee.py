from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from backend.models.employee import EmployeeStatus


class EmployeeBase(BaseModel):
    """Schema base para empleados"""
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    cargo: Optional[str] = Field(None, max_length=255)
    ubicacion: Optional[str] = Field(None, max_length=255)
    departamento: Optional[str] = Field(None, max_length=255)
    empresa: Optional[str] = Field(None, max_length=255)
    estado: EmployeeStatus = EmployeeStatus.ACTIVO


class EmployeeCreate(EmployeeBase):
    """Schema para crear empleado"""
    initial_plan_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    """Schema para actualizar empleado"""
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=255)
    cargo: Optional[str] = Field(None, max_length=255)
    ubicacion: Optional[str] = Field(None, max_length=255)
    departamento: Optional[str] = Field(None, max_length=255)
    empresa: Optional[str] = Field(None, max_length=255)
    estado: Optional[EmployeeStatus] = None
    # Nuevo campo para actualizar el plan del dispositivo actual
    new_plan_id: Optional[int] = None


class EmployeeResponse(EmployeeBase):
    """Schema de respuesta de empleado"""
    id: int
    created_at: datetime
    updated_at: datetime
    dispositivo_actual: Optional[str] = None
    linea_actual: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeWithDevices(EmployeeResponse):
    """Schema de empleado con dispositivos asignados"""
    dispositivos_asignados: List[dict] = []
