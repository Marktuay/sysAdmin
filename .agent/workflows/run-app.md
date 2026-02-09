---
description: Cómo iniciar el sistema (Backend y Frontend)
---

Sigue estos pasos para levantar el sistema completo en tu máquina local:

### 1. Requisitos Previos
Asegúrate de tener instalados:
- Python 3.10+
- Node.js 18+
- MySQL (si prefieres usar la base de datos real, aunque por defecto está configurado con SQLite para facilidad de uso local)

### 2. Iniciar el Backend (FastAPI)
// turbo
1. Abre una terminal en la raíz del proyecto y entra a la carpeta del backend:
   ```bash
   cd backend
   ```
2. (Recomendado) Crea un entorno virtual:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Inicia el servidor:
   ```bash
   sh ../start_backend.sh
   ```
   *El backend estará disponible en `http://localhost:8000`*

### 3. Iniciar el Frontend (React + Vite)
// turbo
1. Abre una **nueva terminal** en la raíz del proyecto y entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *El frontend estará disponible en `http://localhost:5173`*

### 4. Acceso al Sistema
- **URL**: `http://localhost:5173`
- **Usuario**: `admin`
- **Contraseña**: `admin123`
