from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from backend.database import get_db
from backend.models.device import Device, DeviceStatus
from backend.models.employee import Employee
from backend.models.assignment import Assignment
from backend.models.user import User
from backend.services.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Estadísticas generales para el dashboard"""
    total_devices = db.query(Device).count()
    assigned_devices = db.query(Device).filter(Device.estado == DeviceStatus.ASIGNADO).count()
    available_devices = db.query(Device).filter(Device.estado == DeviceStatus.DISPONIBLE).count()
    baja_devices = db.query(Device).filter(Device.estado == DeviceStatus.BAJA).count()
    
    total_employees = db.query(Employee).count()
    
    # Calcular valor actual total (depreciado)
    devices = db.query(Device).all()
    total_value_initial = sum(d.costo_inicial for d in devices)
    
    # Hoy
    today = date.today()
    total_value_current = 0
    for d in devices:
        dep = d.calcular_depreciacion(today)
        total_value_current += dep["valor_actual"]
    
    return {
        "devices": {
            "total": total_devices,
            "assigned": assigned_devices,
            "available": available_devices,
            "baja": baja_devices
        },
        "employees": {
            "total": total_employees
        },
        "financial": {
            "total_value_initial": round(total_value_initial, 2),
            "total_value_current": round(total_value_current, 2),
            "accumulated_depreciation": round(total_value_initial - total_value_current, 2)
        }
    }

@router.get("/devices-by-status")
def get_devices_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Agrupación de dispositivos por estado"""
    stats = db.query(Device.estado, func.count(Device.id)).group_by(Device.estado).all()
    return {s[0].value: s[1] for s in stats}
