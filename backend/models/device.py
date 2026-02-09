from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.models.plan import Plan
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import enum
from backend.database import Base


class DeviceStatus(str, enum.Enum):
    """Estado del dispositivo en el inventario"""
    DISPONIBLE = "disponible"
    ASIGNADO = "asignado"
    BAJA = "baja"


class PhysicalCondition(str, enum.Enum):
    """Condición física del dispositivo"""
    NUEVO = "nuevo"
    USADO = "usado"
    DANADO = "dañado"


class Device(Base):
    """Modelo de dispositivos móviles"""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    marca = Column(String(100), nullable=False)
    modelo = Column(String(100), nullable=False)
    numero_serie = Column(String(255), nullable=True, unique=True, index=True)
    imei = Column(String(20), nullable=True, unique=True, index=True)
    numero_telefono = Column(String(20), nullable=True, unique=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    costo_inicial = Column(Float, nullable=False)
    fecha_compra = Column(Date, nullable=False)
    estado_fisico = Column(Enum(PhysicalCondition), nullable=False, default=PhysicalCondition.NUEVO)
    estado = Column(Enum(DeviceStatus), nullable=False, default=DeviceStatus.DISPONIBLE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    assignments = relationship("Assignment", back_populates="device", cascade="all, delete-orphan")
    plan = relationship("Plan")

    def __repr__(self):
        return f"<Device(marca='{self.marca}', modelo='{self.modelo}', imei='{self.imei}')>"

    @property
    def is_available(self):
        """Verifica si el dispositivo está disponible"""
        return self.estado == DeviceStatus.DISPONIBLE

    @property
    def is_assigned(self):
        """Verifica si el dispositivo está asignado"""
        return self.estado == DeviceStatus.ASIGNADO

    def calcular_depreciacion(self, fecha_calculo: date = None) -> dict:
        """
        Calcula la depreciación del dispositivo usando método de línea recta a 36 meses
        
        Args:
            fecha_calculo: Fecha para calcular la depreciación (default: hoy)
            
        Returns:
            dict con información de depreciación
        """
        if fecha_calculo is None:
            fecha_calculo = date.today()
        
        # Calcular meses de uso
        delta = relativedelta(fecha_calculo, self.fecha_compra)
        meses_uso = delta.years * 12 + delta.months + (delta.days / 30)
        
        # Depreciación lineal a 36 meses
        VIDA_UTIL_MESES = 36
        depreciacion_mensual = self.costo_inicial / VIDA_UTIL_MESES
        
        # Calcular depreciación acumulada (no puede exceder el costo inicial)
        depreciacion_acumulada = min(depreciacion_mensual * meses_uso, self.costo_inicial)
        
        # Calcular valor actual
        valor_actual = max(self.costo_inicial - depreciacion_acumulada, 0)
        
        return {
            "costo_inicial": round(self.costo_inicial, 2),
            "fecha_compra": self.fecha_compra.isoformat(),
            "fecha_calculo": fecha_calculo.isoformat(),
            "meses_uso": round(meses_uso, 2),
            "vida_util_meses": VIDA_UTIL_MESES,
            "depreciacion_mensual": round(depreciacion_mensual, 2),
            "depreciacion_acumulada": round(depreciacion_acumulada, 2),
            "valor_actual": round(valor_actual, 2),
            "porcentaje_depreciado": round((depreciacion_acumulada / self.costo_inicial) * 100, 2)
        }
