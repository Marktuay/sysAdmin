from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import pandas as pd
import io

from backend.database import get_db
from backend.models.device import Device, DeviceStatus, PhysicalCondition
from backend.models.user import User
from backend.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceWithDepreciation, DeviceHistory
from backend.services.auth import get_current_user, get_current_editor, get_current_active_admin

router = APIRouter(prefix="/devices", tags=["Devices"])

from backend.models.assignment import Assignment
from backend.models.employee import Employee
from sqlalchemy import or_

@router.get("/export")
def export_devices(
    search: Optional[str] = None,
    estado: Optional[DeviceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exportar dispositivos a Excel"""
    query = db.query(Device)
    
    if search:
        query = query.outerjoin(Assignment, (Assignment.device_id == Device.id) & (Assignment.fecha_devolucion == None))
        query = query.outerjoin(Employee, Assignment.employee_id == Employee.id)
        
        query = query.filter(
            or_(
                Device.marca.ilike(f"%{search}%"),
                Device.modelo.ilike(f"%{search}%"),
                Device.imei.ilike(f"%{search}%"),
                Device.numero_telefono.ilike(f"%{search}%"),
                Employee.nombre_completo.ilike(f"%{search}%")
            )
        )
    
    if estado:
        query = query.filter(Device.estado == estado)
        
    devices = query.all()
    
    data = []
    for dev in devices:
        asignado_a = "Disponible"
        active_assignment = next((a for a in dev.assignments if a.fecha_devolucion is None), None)
        
        if active_assignment and active_assignment.employee:
            asignado_a = active_assignment.employee.nombre_completo
        elif dev.estado == DeviceStatus.baja:
            asignado_a = "De Baja"
            
        data.append({
            "ID": dev.id,
            "Marca": dev.marca,
            "Modelo": dev.modelo,
            "IMEI": dev.imei,
            "Número": dev.numero_telefono,
            "Estado": dev.estado.value,
            "Estado Físico": dev.estado_fisico.value,
            "Costo Inicial": dev.costo_inicial,
            "Fecha Compra": dev.fecha_compra,
            "Asignado A": asignado_a
        })
    
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Dispositivos')
    
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=dispositivos.xlsx"}
    )

@router.get("/", response_model=List[DeviceResponse])
def read_devices(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    estado: Optional[DeviceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar dispositivos con filtros opcionales"""
    query = db.query(Device)
    
    if search:
        # Unir tablas para buscar por nombre de empleado
        # Usamos outerjoin para no perder dispositivos que no tienen asignaciones
        query = query.outerjoin(Assignment, (Assignment.device_id == Device.id) & (Assignment.fecha_devolucion == None))
        query = query.outerjoin(Employee, Assignment.employee_id == Employee.id)
        
        query = query.filter(
            or_(
                Device.marca.ilike(f"%{search}%"),
                Device.modelo.ilike(f"%{search}%"),
                Device.imei.ilike(f"%{search}%"),
                Device.numero_telefono.ilike(f"%{search}%"),
                Employee.nombre_completo.ilike(f"%{search}%")
            )
        )
    
    if estado:
        query = query.filter(Device.estado == estado)
        
    devices = query.offset(skip).limit(limit).all()

    # Enriquecer con nombre del empleado asignado o historial reciente
    for dev in devices:
        active_assignment = next((a for a in dev.assignments if a.fecha_devolucion is None), None)
        
        if active_assignment and active_assignment.employee:
            dev.asignado_a = active_assignment.employee.nombre_completo
        else:
            # Si no está asignado, buscar la última asignación (historial)
            past_assignments = [a for a in dev.assignments if a.fecha_devolucion is not None]
            if past_assignments:
                # Ordenar por fecha de devolución descendente
                last_assignment = sorted(past_assignments, key=lambda x: x.fecha_devolucion, reverse=True)[0]
                if last_assignment.employee:
                    dev.ultimo_asignado = last_assignment.employee.nombre_completo
                    dev.fecha_devolucion_ultimo = last_assignment.fecha_devolucion

    return devices

@router.get("/available", response_model=List[DeviceResponse])
def read_available_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar solo dispositivos disponibles"""
    return db.query(Device).filter(Device.estado == DeviceStatus.DISPONIBLE).all()

@router.get("/{id}", response_model=DeviceWithDepreciation)
def read_device(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de un dispositivo con cálculo de depreciación"""
    device = db.query(Device).filter(Device.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    # Calcular depreciación
    depreciacion = device.calcular_depreciacion()
    
    # Preparar respuesta
    result = DeviceWithDepreciation.from_orm(device)
    result.depreciacion = depreciacion
    
    return result

@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Crear un nuevo dispositivo (Admin/RRHH)"""
    db_device = Device(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.put("/{id}", response_model=DeviceResponse)
def update_device(
    id: int,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Actualizar un dispositivo (Admin/RRHH)"""
    db_device = db.query(Device).filter(Device.id == id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    obj_data = device_update.dict(exclude_unset=True)
    for key, value in obj_data.items():
        setattr(db_device, key, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{id}", response_model=DeviceResponse)
def delete_device(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Dar de baja un dispositivo (Solo Admin)"""
    db_device = db.query(Device).filter(Device.id == id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    db_device.estado = DeviceStatus.BAJA
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("/{id}/history", response_model=DeviceHistory)
def read_device_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener historial de asignaciones de un dispositivo"""
    device = db.query(Device).filter(Device.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    history = [
        {
            "id": a.id,
            "employee_id": a.employee.id,
            "employee_name": a.employee.nombre_completo,
            "fecha_asignacion": a.fecha_asignacion,
            "fecha_devolucion": a.fecha_devolucion,
            "observaciones": a.observaciones
        } for a in device.assignments
    ]
    
    result = DeviceHistory.from_orm(device)
    result.historial = history
    
    return result
