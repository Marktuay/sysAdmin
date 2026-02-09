from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class Assignment(Base):
    """Modelo de asignaciones de dispositivos a empleados (historial)"""
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    fecha_asignacion = Column(Date, nullable=False, index=True)
    fecha_devolucion = Column(Date, nullable=True, index=True)
    observaciones = Column(Text, nullable=True)
    acta_entrega_url = Column(String(500), nullable=True)
    acta_remision_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    device = relationship("Device", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")

    def __repr__(self):
        return f"<Assignment(device_id={self.device_id}, employee_id={self.employee_id}, fecha={self.fecha_asignacion})>"

    @property
    def is_active(self):
        """Verifica si la asignación está activa (no devuelta)"""
        return self.fecha_devolucion is None

    @property
    def dias_asignado(self):
        """Calcula los días que el dispositivo ha estado asignado"""
        if self.fecha_devolucion:
            return (self.fecha_devolucion - self.fecha_asignacion).days
        else:
            return (datetime.now().date() - self.fecha_asignacion).days
