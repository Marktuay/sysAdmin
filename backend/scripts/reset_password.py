from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.user import User
from backend.services.auth import get_password_hash
import sys

def reset_admin_password(username="admin", new_password="admin123"):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Error: Usuario '{username}' no encontrado.")
            return
        
        print(f"Reseteando contraseña para usuario: {username}")
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"✓ Contraseña actualizada exitosamente a: {new_password}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        reset_admin_password(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "admin123")
    else:
        reset_admin_password()
