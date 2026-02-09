"""
Script para crear las tablas de la base de datos
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database import engine, Base
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.device import Device
from backend.models.assignment import Assignment
from backend.models.plan import Plan

def init_db():
    """Crear todas las tablas"""
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas creadas exitosamente")

if __name__ == "__main__":
    init_db()
