"""
Script para importar datos del Excel actual a la base de datos
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pandas as pd
from datetime import datetime, date
from backend.database import SessionLocal
from backend.models.employee import Employee, EmployeeStatus
from backend.models.device import Device, DeviceStatus, PhysicalCondition
from backend.models.assignment import Assignment
from backend.models.plan import Plan

def clean_phone_number(phone):
    """Limpia y formatea número telefónico"""
    if pd.isna(phone):
        return None
    phone_str = str(phone).strip()
    # Remover espacios y caracteres no numéricos excepto +
    phone_str = ''.join(c for c in phone_str if c.isdigit() or c == '+')
    return phone_str if phone_str else None

def import_from_excel():
    """Importar datos del Excel"""
    db = SessionLocal()
    # Buscar el archivo en el directorio padrea del backend o en el mismo directorio
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    excel_file = os.path.join(base_dir, "Plan_Corregido.xlsx")
    
    if not os.path.exists(excel_file):
        print(f"❌ No se encuentra el archivo: {excel_file}")
        return
    
    try:
        print(f"📂 Leyendo archivo: {excel_file}")
        xls = pd.ExcelFile(excel_file)
        
        # Iterar sobre todas las hojas del Excel
        sheet_names = xls.sheet_names
        print(f"📚 Hojas encontradas: {sheet_names}")
        
        # Contadores globales
        empleados_creados = 0
        dispositivos_creados = 0
        asignaciones_creadas = 0
        
        for sheet_name in sheet_names:
            print(f"\n======== Procesando Hoja: {sheet_name} ========")
            
            # Determinar costo del plan basado en el nombre de la hoja
            # Asumimos formato "PLAN XX.XX"
            costo_plan = 0.0
            nombre_plan = sheet_name.strip()
            
            try:
                # Intenta extraer el número del nombre (ej: "PLAN 34.99" -> 34.99)
                parts = nombre_plan.split(' ')
                for part in parts:
                    if '.' in part and part.replace('.', '').isdigit():
                        costo_plan = float(part)
                        break
            except Exception:
                print(f"⚠️ No se pudo determinar el costo del plan para la hoja '{sheet_name}', se usará 0.0")
            
            # Crear o buscar el plan
            plan = db.query(Plan).filter(Plan.nombre == nombre_plan).first()
            if not plan:
                plan = Plan(nombre=nombre_plan, costo_mensual=costo_plan)
                db.add(plan)
                db.flush()
                print(f"  ✓ Plan Creado/Encontrado: {nombre_plan} (${costo_plan})")
            else:
                 # Actualizar costo si es necesario
                 if plan.costo_mensual != costo_plan and costo_plan > 0:
                     plan.costo_mensual = costo_plan
                 print(f"  ✓ Plan Existente: {nombre_plan}")

            
            # Leer la hoja actual
            df = pd.read_excel(xls, sheet_name=sheet_name)
            print(f"📊 Registros en hoja: {len(df)}")
            
            for idx, row in df.iterrows():
                try:
                    # Saltar filas vacías
                    if pd.isna(row.get('Nombre Y Apellido')):
                        continue
                    
                    nombre = str(row['Nombre Y Apellido']).strip()
                    cargo = str(row.get('Cargo', '')).strip() if not pd.isna(row.get('Cargo')) else None
                    ubicacion = str(row.get('Ubicacion', '')).strip() if not pd.isna(row.get('Ubicacion')) else None
                    empresa = str(row.get('Empresa', '')).strip() if not pd.isna(row.get('Empresa')) else None
                    estado_contrato = str(row.get('Estado Contrato', 'ACTIVO')).strip().upper()
                
                    # Verificar si el empleado ya existe
                    existing_employee = db.query(Employee).filter(Employee.nombre_completo == nombre).first()
                
                    if not existing_employee:
                        # Crear empleado
                        employee = Employee(
                            nombre_completo=nombre,
                            cargo=cargo,
                            ubicacion=ubicacion,
                            empresa=empresa,
                            estado=EmployeeStatus.ACTIVO if estado_contrato == 'ACTIVO' else EmployeeStatus.INACTIVO
                        )
                        db.add(employee)
                        db.flush()  # Para obtener el ID
                        empleados_creados += 1
                        print(f"  ✓ Empleado: {nombre}")
                    else:
                        employee = existing_employee
                        print(f"  - Empleado ya existe: {nombre}")
                    # Procesar dispositivo si tiene equipo asignado
                    equipo = row.get('Equipo')
                    numero_telefono = clean_phone_number(row.get('Número'))
                    
                    if not pd.isna(equipo) and equipo:
                        equipo_str = str(equipo).strip()
                        
                        # Parsear marca y modelo del equipo
                        # Ejemplos: "SAMSUNG A52", "IPHONE 8 PLUS", "SAMSUNG S24+"
                        parts = equipo_str.split(maxsplit=1)
                        marca = parts[0] if len(parts) > 0 else "DESCONOCIDO"
                        modelo = parts[1] if len(parts) > 1 else equipo_str
                        
                        # Verificar si el dispositivo ya existe por número telefónico
                        existing_device = None
                        if numero_telefono:
                            existing_device = db.query(Device).filter(Device.numero_telefono == numero_telefono).first()
                        
                        if not existing_device:
                            # Crear dispositivo
                            # Estimar costo basado en el modelo (valores aproximados)
                            costo_estimado = 200.0  # Default
                            if 'S24' in modelo.upper() or 'S22' in modelo.upper():
                                costo_estimado = 450.0
                            elif 'IPHONE' in marca.upper():
                                costo_estimado = 400.0
                            elif 'A5' in modelo.upper() or 'A3' in modelo.upper():
                                costo_estimado = 250.0
                            elif 'A0' in modelo.upper() or 'A1' in modelo.upper() or 'A2' in modelo.upper():
                                costo_estimado = 150.0
                            
                            device = Device(
                                marca=marca,
                                modelo=modelo,
                                numero_telefono=numero_telefono,
                                costo_inicial=costo_estimado,
                                fecha_compra=date(2024, 1, 1),  # Fecha estimada
                                estado_fisico=PhysicalCondition.USADO,
                                estado=DeviceStatus.ASIGNADO,
                                plan_id=plan.id
                            )
                            db.add(device)
                            db.flush()
                            dispositivos_creados += 1
                            print(f"    ✓ Dispositivo: {marca} {modelo} ({numero_telefono})")
                            
                            # Crear asignación
                            assignment = Assignment(
                                device_id=device.id,
                                employee_id=employee.id,
                                fecha_asignacion=date(2024, 1, 1),  # Fecha estimada
                                observaciones=f"Importado desde Excel - Plan {nombre_plan}"
                            )
                            db.add(assignment)
                            asignaciones_creadas += 1
                            print(f"    ✓ Asignación creada")
                        else:
                            print(f"    - Dispositivo ya existe: {numero_telefono}")
                
                except Exception as e:
                    print(f"  ✗ Error en fila {idx + 2}: {e}")
                    continue
        
        # Commit final
        db.commit()
        
        print("\n" + "="*60)
        print("✅ IMPORTACIÓN COMPLETADA")
        print("="*60)
        print(f"📊 Empleados creados: {empleados_creados}")
        print(f"📱 Dispositivos creados: {dispositivos_creados}")
        print(f"🔗 Asignaciones creadas: {asignaciones_creadas}")
        print("="*60)
        
        # Mostrar resumen
        total_employees = db.query(Employee).count()
        total_devices = db.query(Device).count()
        total_assignments = db.query(Assignment).count()
        
        print(f"\n📈 TOTALES EN BASE DE DATOS:")
        print(f"  Empleados: {total_employees}")
        print(f"  Dispositivos: {total_devices}")
        print(f"  Asignaciones: {total_assignments}")
        
    except FileNotFoundError:
        print(f"✗ Error: No se encontró el archivo {excel_file}")
        print(f"  Asegúrate de que el archivo esté en: {os.path.abspath(excel_file)}")
    except Exception as e:
        print(f"✗ Error durante la importación: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("IMPORTACIÓN DE DATOS DESDE EXCEL")
    print("="*60)
    import_from_excel()
