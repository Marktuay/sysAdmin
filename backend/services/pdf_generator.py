from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import os


def format_date_spanish(date_obj):
    """Formatea una fecha en formato español: DD de Mes del YYYY"""
    if not date_obj:
        return "N/A"
    months = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
        7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    # Si es datetime, usar solo date, si es date, usuarlo directo
    d = date_obj
    return f"{d.day:02d} de {months[d.month]} del {d.year}"


def generate_acta_entrega(assignment_data: dict, output_dir: str = "backend/static/pdfs") -> str:
    """
    Genera el PDF del Acta de Entrega basado en el formato proporcionado
    
    Args:
        assignment_data: Diccionario con datos de la asignación
        output_dir: Directorio donde guardar el PDF
        
    Returns:
        str: Ruta del archivo PDF generado
    """
    # Crear directorio si no existe
    os.makedirs(output_dir, exist_ok=True)
    
    # Nombre del archivo
    filename = f"acta_entrega_{assignment_data['employee_name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    # Crear documento
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Contenedor para elementos
    elements = []

    # Logo
    logo_path = "backend/static/images/cropped-logo.png"
    if os.path.exists(logo_path):
        try:
            # Mantener aspect ratio aprox
            img = Image(logo_path, width=1.5*inch, height=0.55*inch)
            img.hAlign = 'LEFT'
            elements.append(img)
            elements.append(Spacer(1, 0.1*inch))
        except Exception:
            pass
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Título
    elements.append(Paragraph("MEMORANDO", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Información del memorando
    memo_info = [
        f"<b>Para:</b> {assignment_data['employee_name']}",
        f"<b>Cargo:</b> {assignment_data.get('employee_cargo', 'N/A')}",
        "",
        f"<b>De:</b> {assignment_data.get('responsable_nombre', 'Alvaro José Zapata Téllez')}",
        f"<b>Cargo:</b> {assignment_data.get('responsable_cargo', 'Responsable de Informática')}",
        "",
        f"<b>Asunto:</b> ASIGNACIÓN DE CELULAR",
        "",
        f"<b>Fecha:</b> Managua, {format_date_spanish(assignment_data['fecha_asignacion'])}",
    ]
    
    for line in memo_info:
        elements.append(Paragraph(line, styles['Normal']))
        elements.append(Spacer(1, 0.1*inch))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Cuerpo del texto
    body_text = """
    Con el fin de facilitar el desempeño de sus funciones, por este medio se le hace asignación 
    formal de un (01) celular con su cargador.
    <br/><br/>
    Asimismo, se le hace de su conocimiento que, en caso de pérdida, avería por mal uso o cualquier 
    otro tipo de afectación que no permita el correcto funcionamiento del equipo, el valor total del 
    mismo deberá ser cubierto por Usted.
    <br/><br/>
    En caso de que el equipo presente cualquier tipo de falla, se le solicita notificar de inmediato 
    al departamento de informática y no realizar por su cuenta ninguna acción, como, por ejemplo: 
    abrirlo, llevar a un técnico particular para intentar repararlo, etc.
    <br/><br/>
    Este equipo es propiedad de la empresa New Century, por lo que queda completamente prohibido 
    agregar documentos, archivos o programas de uso personal sin la autorización del departamento 
    de Informática y con la previa autorización de su jefe inmediato.
    <br/><br/>
    Sin más a que referirme, saludos
    <br/><br/>
    Atentamente,
    """
    
    elements.append(Paragraph(body_text, styles['Normal']))
    elements.append(Spacer(1, 0.4*inch))
    
    # Tabla de equipos
    table_data = [
        ['Descripción', 'Marca', 'Modelo', 'No. Serie', 'Fecha', 'Cant.', 'Estado'],
        [
            f"Celular con línea {assignment_data.get('numero_telefono', 'N/A')}",
            assignment_data['device_marca'],
            assignment_data['device_modelo'],
            f"IMEI: {assignment_data.get('device_imei', 'N/A')}",
            format_date_spanish(assignment_data['fecha_asignacion']),
            '1',
            assignment_data.get('device_estado_fisico', 'Nuevo')
        ],
        [
            'Cargador',
            assignment_data['device_marca'],
            '',
            '',
            format_date_spanish(assignment_data['fecha_asignacion']),
            '1',
            'Nuevo'
        ]
    ]
    
    table = Table(table_data, colWidths=[1.6*inch, 0.7*inch, 0.7*inch, 1.2*inch, 1.3*inch, 0.3*inch, 0.6*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Firmas
    signature_text = """
    <br/><br/>
    _______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    _______________________________<br/>
    <b>Entregué conforme</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <b>Recibí conforme</b>
    """
    
    elements.append(Paragraph(signature_text, styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    
    return filepath


def generate_acta_remision(assignment_data: dict, output_dir: str = "backend/static/pdfs") -> str:
    """
    Genera el PDF del Acta de Remisión basado en el formato proporcionado
    
    Args:
        assignment_data: Diccionario con datos de la devolución
        output_dir: Directorio donde guardar el PDF
        
    Returns:
        str: Ruta del archivo PDF generado
    """
    # Crear directorio si no existe
    os.makedirs(output_dir, exist_ok=True)
    
    # Nombre del archivo
    filename = f"acta_remision_{assignment_data['employee_name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    # Crear documento
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Contenedor para elementos
    elements = []

    # Logo
    logo_path = "backend/static/images/cropped-logo.png"
    if os.path.exists(logo_path):
        try:
            img = Image(logo_path, width=1.5*inch, height=0.55*inch)
            img.hAlign = 'LEFT'
            elements.append(img)
            elements.append(Spacer(1, 0.1*inch))
        except Exception:
            pass
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Título
    elements.append(Paragraph("ACTA DE REMISIÓN DE EQUIPOS", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Información
    info_text = f"""
    <b>Empleado:</b> {assignment_data['employee_name']}<br/>
    <b>Cargo:</b> {assignment_data.get('employee_cargo', 'N/A')}<br/>
    <b>Fecha de devolución:</b> {format_date_spanish(assignment_data['fecha_devolucion'])}<br/>
    <b>Fecha de asignación original:</b> {format_date_spanish(assignment_data['fecha_asignacion'])}<br/>
    """
    
    elements.append(Paragraph(info_text, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Tabla de equipos devueltos
    table_data = [
        ['Equipo', 'Marca', 'Modelo', 'No. Serie / IMEI', 'Fecha', 'Cant.'],
        [
            'Celular',
            assignment_data['device_marca'],
            assignment_data['device_modelo'],
            f"S/N: {assignment_data.get('device_numero_serie', 'N/A')}\nIMEI: {assignment_data.get('device_imei', 'N/A')}",
            format_date_spanish(datetime.now()), # Fecha de generación
            '1'
        ],
        [
            'Cargador / C/USB',
            assignment_data['device_marca'],
            '',
            '',
            format_date_spanish(datetime.now()),
            '1'
        ]
    ]
    
    table = Table(table_data, colWidths=[1.3*inch, 0.9*inch, 0.9*inch, 1.6*inch, 1.3*inch, 0.4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Observaciones
    if assignment_data.get('observaciones'):
        obs_text = f"<b>Observaciones:</b> {assignment_data['observaciones']}"
        elements.append(Paragraph(obs_text, styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
    
    # Texto final
    final_text = """
    Sin más a que referirme, saludos
    """
    elements.append(Paragraph(final_text, styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Firmas
    signature_text = """
    <br/><br/>
    _______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    _______________________________<br/>
    <b>Entregué conforme</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <b>Recibí conforme</b>
    """
    
    elements.append(Paragraph(signature_text, styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    
    return filepath
