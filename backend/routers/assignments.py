from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os
import pandas as pd
import io

from backend.database import get_db
from backend.models.assignment import Assignment
from backend.models.device import Device, DeviceStatus
from backend.models.employee import Employee
from backend.models.user import User
from backend.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentWithDetails
from backend.services.auth import get_current_user, get_current_editor
from backend.services.pdf_generator import generate_acta_entrega, generate_acta_remision

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.get("/export")
def export_assignments(
    search: Optional[str] = None,
    employee_id: Optional[int] = None,
    device_id: Optional[int] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exportar historial de asignaciones a Excel"""
    query = db.query(Assignment)
    
    if search:
        query = query.join(Assignment.employee).join(Assignment.device).filter(
            (Employee.nombre_completo.ilike(f"%{search}%")) |
            (Device.marca.ilike(f"%{search}%")) |
            (Device.modelo.ilike(f"%{search}%")) |
            (Device.imei.ilike(f"%{search}%")) |
            (Device.numero_telefono.ilike(f"%{search}%"))
        )

    if employee_id:
        query = query.filter(Assignment.employee_id == employee_id)
    
    if device_id:
        query = query.filter(Assignment.device_id == device_id)
        
    if active_only:
        query = query.filter(Assignment.fecha_devolucion == None)
        
    assignments = query.all()
    
    data = []
    for assign in assignments:
        estado = "Activa" if not assign.fecha_devolucion else "Devuelta"
        
        data.append({
            "ID asignación": assign.id,
            "Empleado": assign.employee.nombre_completo if assign.employee else "N/A",
            "Cargo": assign.employee.cargo if assign.employee else "N/A",
            "Dispositivo": f"{assign.device.marca} {assign.device.modelo}" if assign.device else "N/A",
            "IMEI": assign.device.imei if assign.device else "N/A",
            "Línea": assign.device.numero_telefono if assign.device else "N/A",
            "Fecha Asignación": assign.fecha_asignacion,
            "Fecha Devolución": assign.fecha_devolucion,
            "Estado": estado,
            "Observaciones": assign.observaciones
        })
    
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Asignaciones')
    
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=asignaciones.xlsx"}
    )

@router.get("/", response_model=List[AssignmentResponse])
def read_assignments(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    employee_id: Optional[int] = None,
    device_id: Optional[int] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar asignaciones con filtros opcionales"""
    query = db.query(Assignment)
    
    if search:
        query = query.join(Assignment.employee).join(Assignment.device).filter(
            (Employee.nombre_completo.ilike(f"%{search}%")) |
            (Device.marca.ilike(f"%{search}%")) |
            (Device.modelo.ilike(f"%{search}%")) |
            (Device.imei.ilike(f"%{search}%")) |
            (Device.numero_telefono.ilike(f"%{search}%"))
        )

    if employee_id:
        query = query.filter(Assignment.employee_id == employee_id)
    
    if device_id:
        query = query.filter(Assignment.device_id == device_id)
        
    if active_only:
        query = query.filter(Assignment.fecha_devolucion == None)
        
    return query.order_by(Assignment.fecha_asignacion.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=AssignmentWithDetails)
def read_assignment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de una asignación"""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    return assignment

@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Crear una nueva asignación y generar Acta de Entrega"""
    # Verificar si el dispositivo existe y está disponible
    device = db.query(Device).filter(Device.id == assignment.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    if device.estado != DeviceStatus.DISPONIBLE:
        raise HTTPException(status_code=400, detail="El dispositivo no está disponible")
    
    # Verificar si el empleado existe
    employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Crear asignación
    db_assignment = Assignment(**assignment.dict())
    db.add(db_assignment)
    
    # Actualizar estado del dispositivo
    device.estado = DeviceStatus.ASIGNADO
    
    db.commit()
    db.refresh(db_assignment)
    
    # Generar Acta de Entrega
    try:
        data_pdf = {
            "employee_name": employee.nombre_completo,
            "employee_cargo": employee.cargo,
            "responsable_nombre": current_user.username,
            "responsable_cargo": current_user.role.value,
            "fecha_asignacion": db_assignment.fecha_asignacion,
            "numero_telefono": device.numero_telefono,
            "device_marca": device.marca,
            "device_modelo": device.modelo,
            "device_imei": device.imei,
            "device_estado_fisico": device.estado_fisico.value
        }
        pdf_path = generate_acta_entrega(data_pdf)
        db_assignment.acta_entrega_url = f"/pdfs/{os.path.basename(pdf_path)}"
        db.commit()
    except Exception as e:
        print(f"Error generando PDF: {e}")
        # No bloqueamos la creación de la asignación si falla el PDF, pero avisamos en logs
    
    return db_assignment

@router.put("/{id}/return", response_model=AssignmentResponse)
def return_device(
    id: int,
    return_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Registrar devolución de equipo y generar Acta de Remisión"""
    db_assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    if db_assignment.fecha_devolucion is not None:
        raise HTTPException(status_code=400, detail="Este equipo ya fue devuelto")
    
    # Actualizar asignación
    db_assignment.fecha_devolucion = return_data.fecha_devolucion or date.today()
    if return_data.observaciones:
        db_assignment.observaciones = (db_assignment.observaciones or "") + "\n" + return_data.observaciones
    
    # Actualizar estado del dispositivo
    db_assignment.device.estado = DeviceStatus.DISPONIBLE
    
    db.commit()
    db.refresh(db_assignment)
    
    # Generar Acta de Remisión
    try:
        data_pdf = {
            "employee_name": db_assignment.employee.nombre_completo,
            "employee_cargo": db_assignment.employee.cargo,
            "fecha_asignacion": db_assignment.fecha_asignacion,
            "fecha_devolucion": db_assignment.fecha_devolucion,
            "device_marca": db_assignment.device.marca,
            "device_modelo": db_assignment.device.modelo,
            "device_numero_serie": db_assignment.device.numero_serie,
            "device_imei": db_assignment.device.imei,
            "observaciones": return_data.observaciones
        }
        pdf_path = generate_acta_remision(data_pdf)
        db_assignment.acta_remision_url = f"/pdfs/{os.path.basename(pdf_path)}"
        db.commit()
    except Exception as e:
        print(f"Error generando PDF de remisión: {e}")
    
    return db_assignment

@router.get("/{id}/pdf/{doc_type}")
def get_assignment_pdf(
    id: int,
    doc_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener o generar PDF de asignación (entrega o remision)"""
    if doc_type not in ["entrega", "remision"]:
        raise HTTPException(status_code=400, detail="Tipo de documento inválido")
        
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
        
    # Determinar campo de URL y función generadora
    url_field = f"acta_{doc_type}_url"
    current_url = getattr(assignment, url_field)
    
    # Si ya existe el archivo, devolverlo
    if current_url:
        # El URL guardado es relativo a static, ej: /pdfs/archivo.pdf
        # Necesitamos la ruta física. Asumimos que static está en backend/static
        # current_url starts with /pdfs/
        filename = os.path.basename(current_url)
        # Construct absolute path safely
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "pdfs", filename)
        
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="application/pdf", filename=filename)
    
    # Si no existe, generarlo
    try:
        if doc_type == "entrega":
            data_pdf = {
                "employee_name": assignment.employee.nombre_completo,
                "employee_cargo": assignment.employee.cargo,
                "responsable_nombre": current_user.username,
                "responsable_cargo": getattr(current_user.role, "value", "Admin"),
                "fecha_asignacion": assignment.fecha_asignacion,
                "numero_telefono": assignment.device.numero_telefono,
                "device_marca": assignment.device.marca,
                "device_modelo": assignment.device.modelo,
                "device_imei": assignment.device.imei,
                "device_estado_fisico": assignment.device.estado_fisico.value
            }
            pdf_path = generate_acta_entrega(data_pdf)
        else: # remision
            # Solo si está devuelto
            if not assignment.fecha_devolucion:
                raise HTTPException(status_code=400, detail="El equipo no ha sido devuelto aún")
                
            data_pdf = {
                "employee_name": assignment.employee.nombre_completo,
                "employee_cargo": assignment.employee.cargo,
                "fecha_asignacion": assignment.fecha_asignacion,
                "fecha_devolucion": assignment.fecha_devolucion,
                "device_marca": assignment.device.marca,
                "device_modelo": assignment.device.modelo,
                "device_numero_serie": assignment.device.numero_serie,
                "device_imei": assignment.device.imei,
                "observaciones": assignment.observaciones
            }
            pdf_path = generate_acta_remision(data_pdf)
            
        # Actualizar DB
        setattr(assignment, url_field, f"/pdfs/{os.path.basename(pdf_path)}")
        db.commit()
        
        return FileResponse(pdf_path, media_type="application/pdf", filename=os.path.basename(pdf_path))
        
    except Exception as e:
        print(f"Error generando PDF manual: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")
