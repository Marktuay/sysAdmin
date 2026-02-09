from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from backend.database import Base


class Plan(Base):
    """Modelo de planes telefónicos (para futuro)"""
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True, index=True)
    costo_mensual = Column(Float, nullable=False)
    descripcion = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Plan(nombre='{self.nombre}', costo=${self.costo_mensual})>"
