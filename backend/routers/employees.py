from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io

from backend.database import get_db
from backend.models.employee import Employee, EmployeeStatus
from backend.models.user import User
from backend.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeWithDevices
from backend.services.auth import get_current_user, get_current_editor

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[EmployeeResponse])
def read_employees(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    estado: Optional[EmployeeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar empleados con filtros opcionales"""
    query = db.query(Employee)
    
    if search:
        query = query.filter(Employee.nombre_completo.ilike(f"%{search}%"))
    
    if estado:
        query = query.filter(Employee.estado == estado)
        
    employees = query.offset(skip).limit(limit).all()

    # Enriquecer con datos del dispositivo actual
    for emp in employees:
        active_assignment = next((a for a in emp.assignments if a.fecha_devolucion is None), None)
        if active_assignment and active_assignment.device:
            emp.dispositivo_actual = f"{active_assignment.device.marca} {active_assignment.device.modelo}"
            emp.linea_actual = active_assignment.device.numero_telefono or "Sin línea"
            if active_assignment.device.plan:
                 emp.linea_actual += f" - {active_assignment.device.plan.nombre} (${active_assignment.device.plan.costo_mensual:.2f})"
        else:
            emp.dispositivo_actual = "Sin asignar"
            emp.linea_actual = "-"

    return employees

@router.get("/export")
def export_employees(
    search: Optional[str] = None,
    estado: Optional[EmployeeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exportar empleados a Excel"""
    query = db.query(Employee)
    
    if search:
        query = query.filter(Employee.nombre_completo.ilike(f"%{search}%"))
    
    if estado:
        query = query.filter(Employee.estado == estado)
        
    employees = query.all()
    
    data = []
    for emp in employees:
        active_assignment = next((a for a in emp.assignments if a.fecha_devolucion is None), None)
        dispositivo = "Sin asignar"
        linea = "-"
        
        if active_assignment and active_assignment.device:
             dispositivo = f"{active_assignment.device.marca} {active_assignment.device.modelo}"
             linea = active_assignment.device.numero_telefono or "Sin línea"
        
        data.append({
            "ID": emp.id,
            "Nombre Completo": emp.nombre_completo,
            "Cargo": emp.cargo,
            "Departamento": emp.departamento,
            "Ubicación": emp.ubicacion,
            "Empresa": emp.empresa,
            "Estado": emp.estado.value,
            "Dispositivo Actual": dispositivo,
            "Línea": linea
        })
    
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    
    # Auto-adjust columns width logic is a bit complex with pandas alone, but basic export works
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Empleados')
    
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=empleados.xlsx"}
    )

@router.get("/{id}", response_model=EmployeeWithDevices)
def read_employee(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalle de un empleado por ID"""
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Obtener dispositivos actualmente asignados
    active_assignments = [a for a in employee.assignments if a.fecha_devolucion is None]
    
    # Preparar respuesta
    result = EmployeeWithDevices.from_orm(employee)
    result.dispositivos_asignados = [
        {
            "id": a.device.id,
            "marca": a.device.marca,
            "modelo": a.device.modelo,
            "numero_telefono": a.device.numero_telefono,
            "assignment_id": a.id,
            "fecha_asignacion": a.fecha_asignacion
        } for a in active_assignments
    ]
    
    return result

from backend.models.device import Device, DeviceStatus
from backend.models.assignment import Assignment
from backend.services.pdf_generator import generate_acta_entrega
import os
from datetime import date

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Crear un nuevo empleado (Admin/RRHH)"""
    # Separar datos del empleado de campos especiales
    emp_data = employee.dict(exclude={'initial_plan_id'})
    initial_plan_id = employee.initial_plan_id

    db_employee = Employee(**emp_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    # Manejar asignación inicial de plan si se solicitó
    if initial_plan_id:
        # Crear un dispositivo genérico para alojar el plan
        # Esto permite facturar el plan sin asignar un teléfono físico específico aún
        new_device = Device(
            marca="Generico",
            modelo="Plan Inicial",
            costo_inicial=0,
            fecha_compra=date.today(),
            estado=DeviceStatus.ASIGNADO,
            plan_id=initial_plan_id
        )
        db.add(new_device)
        db.commit()
        db.refresh(new_device)

        # Asignar al empleado
        assignment = Assignment(
            device_id=new_device.id,
            employee_id=db_employee.id,
            fecha_asignacion=date.today(),
            observaciones="Asignación automática al crear empleado con plan"
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        # Generar Acta de Entrega
        try:
            data_pdf = {
                "employee_name": db_employee.nombre_completo,
                "employee_cargo": db_employee.cargo,
                "responsable_nombre": current_user.username,
                "responsable_cargo": getattr(current_user.role, 'value', 'Admin'),
                "fecha_asignacion": assignment.fecha_asignacion,
                "numero_telefono": new_device.numero_telefono,
                "device_marca": new_device.marca,
                "device_modelo": new_device.modelo,
                "device_imei": new_device.imei,
                "device_estado_fisico": new_device.estado_fisico.value
            }
            pdf_path = generate_acta_entrega(data_pdf)
            assignment.acta_entrega_url = f"/pdfs/{os.path.basename(pdf_path)}"
            db.commit()
        except Exception as e:
            print(f"Error generando PDF de entrega automática: {e}")

    return db_employee

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    employee_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Actualizar un empleado (Admin/RRHH) y opcionalmente su plan de dispositivo"""
    db_employee = db.query(Employee).filter(Employee.id == id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Datos de usuario
    obj_data = employee_update.dict(exclude_unset=True)
    
    # Manejar cambio de plan en dispositivo actual
    if 'new_plan_id' in obj_data:
        new_plan_id = obj_data.pop('new_plan_id')
        if new_plan_id:
             # Buscar asignación activa
            active_assignment = next((a for a in db_employee.assignments if a.fecha_devolucion is None), None)
            if active_assignment and active_assignment.device:
                active_assignment.device.plan_id = new_plan_id
                # El cambio se dispara en cascada o se guarda al commit

    for key, value in obj_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/{id}/history", response_model=List[dict])
def read_employee_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Historial de asignaciones de un empleado"""
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return [
        {
            "id": a.id,
            "device_id": a.device.id,
            "device_name": f"{a.device.marca} {a.device.modelo}",
            "fecha_asignacion": a.fecha_asignacion,
            "fecha_devolucion": a.fecha_devolucion,
            "estado": "Activa" if a.fecha_devolucion is None else "Finalizada"
        } for a in employee.assignments
    ]

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_editor)
):
    """Eliminar un empleado (Admin/RRHH)"""
    db_employee = db.query(Employee).filter(Employee.id == id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    db.delete(db_employee)
    db.commit()
    return None
