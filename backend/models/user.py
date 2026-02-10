from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.database import Base


class UserRole(str, enum.Enum):
    """Roles de usuario en el sistema"""
    ADMIN = "admin"
    RRHH = "rrhh"
    SUPERVISOR = "supervisor"
    CONTABILIDAD = "contabilidad"
    AUDITORIA = "auditoria"


class User(Base):
    """Modelo de usuarios del sistema"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SUPERVISOR)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"

    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == UserRole.ADMIN

    @property
    def can_edit(self):
        """Verifica si el usuario puede editar (admin o rrhh)"""
        return self.role in [UserRole.ADMIN, UserRole.RRHH]

    @property
    def is_read_only(self):
        """Verifica si el usuario solo tiene permisos de lectura"""
        return self.role in [UserRole.SUPERVISOR, UserRole.CONTABILIDAD, UserRole.AUDITORIA]
