from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from backend.routers import auth, employees, devices, assignments, reports, plans, users

# Cargar variables de entorno
load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="Sistema de Gestión de Dispositivos Móviles",
    description="API para gestión de dispositivos móviles asignados a empleados",
    version="1.0.0"
)

# Configurar CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar directorio de PDFs generados
os.makedirs("backend/static/pdfs", exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="backend/static/pdfs"), name="pdfs")

# Registrar routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(devices.router)
app.include_router(assignments.router)
app.include_router(reports.router)
app.include_router(reports.router)
app.include_router(plans.router)
app.include_router(users.router)

# Ruta raíz
@app.get("/")
async def root():
    return {
        "message": "Sistema de Gestión de Dispositivos Móviles API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
