"""
Script para crear un usuario administrador inicial
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database import SessionLocal
from backend.models.user import User, UserRole
from backend.services.auth import get_password_hash

def create_admin():
    """Crear usuario administrador"""
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing_admin:
            print(f"✓ Ya existe un administrador: {existing_admin.username}")
            return
        
        # Crear admin
        admin = User(
            username="admin",
            email="admin@newcentury.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✓ Usuario administrador creado exitosamente")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Password: admin123")
        print(f"  Role: {admin.role.value}")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login")
        
    except Exception as e:
        print(f"✗ Error al crear administrador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
