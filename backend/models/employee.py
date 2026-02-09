from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.database import Base


class EmployeeStatus(str, enum.Enum):
    """Estado del empleado"""
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class Employee(Base):
    """Modelo de empleados de la empresa"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), nullable=False, index=True)
    cargo = Column(String(255), nullable=True)
    ubicacion = Column(String(255), nullable=True)
    departamento = Column(String(255), nullable=True)
    empresa = Column(String(255), nullable=True)
    estado = Column(Enum(EmployeeStatus), nullable=False, default=EmployeeStatus.ACTIVO)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    assignments = relationship("Assignment", back_populates="employee", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Employee(nombre='{self.nombre_completo}', cargo='{self.cargo}')>"

    @property
    def is_active(self):
        """Verifica si el empleado está activo"""
        return self.estado == EmployeeStatus.ACTIVO
