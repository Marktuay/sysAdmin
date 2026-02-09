import sys
import os
import glob
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database import SessionLocal, engine
# Import all models to ensure relationships work
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.device import Device
from backend.models.assignment import Assignment
from backend.models.plan import Plan

def reset_pdf_urls():
    db = SessionLocal()
    try:
        print("🔄 Conectando a la base de datos...")
        assignments = db.query(Assignment).all()
        print(f"📊 Encontradas {len(assignments)} asignaciones.")
        
        count = 0
        for assignment in assignments:
            updated = False
            if assignment.acta_entrega_url:
                assignment.acta_entrega_url = None
                updated = True
            if assignment.acta_remision_url:
                assignment.acta_remision_url = None
                updated = True
            
            if updated:
                count += 1
        
        db.commit()
        print(f"✅ URLs reseteadas en {count} asignaciones.")
        
        # Eliminar archivos físicos
        pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "pdfs")
        if os.path.exists(pdf_dir):
            files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
            print(f"🗑️  Eliminando {len(files)} archivos PDF antiguos...")
            for f in files:
                try:
                    os.remove(f)
                except Exception as e:
                    print(f"Error borrando {f}: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_pdf_urls()
