from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from backend.models.device import DeviceStatus, PhysicalCondition


class DeviceBase(BaseModel):
    """Schema base para dispositivos"""
    marca: str = Field(..., min_length=1, max_length=100)
    modelo: str = Field(..., min_length=1, max_length=100)
    numero_serie: Optional[str] = Field(None, max_length=255)
    imei: Optional[str] = Field(None, max_length=20)
    numero_telefono: Optional[str] = Field(None, max_length=20)
    costo_inicial: float = Field(..., ge=0)
    fecha_compra: date
    estado_fisico: PhysicalCondition = PhysicalCondition.NUEVO
    estado: DeviceStatus = DeviceStatus.DISPONIBLE


class DeviceCreate(DeviceBase):
    """Schema para crear dispositivo"""
    pass


class DeviceUpdate(BaseModel):
    """Schema para actualizar dispositivo"""
    marca: Optional[str] = Field(None, min_length=1, max_length=100)
    modelo: Optional[str] = Field(None, min_length=1, max_length=100)
    numero_serie: Optional[str] = Field(None, max_length=255)
    imei: Optional[str] = Field(None, max_length=20)
    numero_telefono: Optional[str] = Field(None, max_length=20)
    costo_inicial: Optional[float] = Field(None, ge=0)
    fecha_compra: Optional[date] = None
    estado_fisico: Optional[PhysicalCondition] = None
    estado: Optional[DeviceStatus] = None


class DeviceResponse(DeviceBase):
    """Schema de respuesta de dispositivo"""
    id: int
    created_at: datetime
    updated_at: datetime
    asignado_a: Optional[str] = None
    ultimo_asignado: Optional[str] = None
    fecha_devolucion_ultimo: Optional[date] = None

    class Config:
        from_attributes = True


class DeviceWithDepreciation(DeviceResponse):
    """Schema de dispositivo con cálculo de depreciación"""
    depreciacion: dict


class DeviceHistory(DeviceResponse):
    """Schema de dispositivo con historial de asignaciones"""
    historial: List[dict] = []
