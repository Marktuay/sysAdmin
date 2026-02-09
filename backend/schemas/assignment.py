from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class AssignmentBase(BaseModel):
    """Schema base para asignaciones"""
    device_id: int = Field(..., gt=0)
    employee_id: int = Field(..., gt=0)
    fecha_asignacion: date
    observaciones: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    """Schema para crear asignación"""
    pass


class AssignmentUpdate(BaseModel):
    """Schema para actualizar asignación"""
    fecha_devolucion: Optional[date] = None
    observaciones: Optional[str] = None


class DeviceBrief(BaseModel):
    """Schema para información básica de dispositivo"""
    marca: str
    modelo: str
    imei: Optional[str] = None
    numero_telefono: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeBrief(BaseModel):
    """Schema para información básica de empleado"""
    nombre_completo: str
    cargo: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentResponse(AssignmentBase):
    """Schema de respuesta de asignación"""
    id: int
    fecha_devolucion: Optional[date] = None
    acta_entrega_url: Optional[str] = None
    acta_remision_url: Optional[str] = None
    device: Optional[DeviceBrief] = None
    employee: Optional[EmployeeBrief] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssignmentWithDetails(AssignmentResponse):
    """Schema de asignación con detalles extendidos"""
    pass
