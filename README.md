# Sistema de Gestión de Dispositivos Móviles

Sistema web completo para la gestión de dispositivos móviles asignados a empleados, con cálculo automático de depreciación, historial de asignaciones y generación de actas.

## 🚀 Características

- ✅ Gestión completa de empleados
- ✅ Gestión de dispositivos móviles con cálculo de depreciación (36 meses)
- ✅ Historial completo de asignaciones
- ✅ Generación automática de Actas de Entrega y Remisión en PDF
- ✅ Sistema de autenticación con JWT
- ✅ Control de acceso basado en roles (Admin, RRHH, Supervisor, Contabilidad, Auditoría)
- ✅ Importación de datos desde Excel
- ✅ Frontend moderno con React y Vite
- 🔮 Futuro: Control de planes, consumo y geolocalización

## � Actualizaciones Recientes (Febrero 2026)

### �️ Módulo de Administración y Seguridad
- **Gestión de Usuarios**: Nuevo panel administrativo para crear, editar y gestionar los accesos de los usuarios del sistema.
- **Auditoría de Actividad**: Registro automático de eventos de seguridad (`UserActivity`), incluyendo direcciones IP, fecha/hora y tipo de acción (Login/Logout).
- **Protección de Rutas**: Implementación robusta de guardias de navegación para restringir el acceso a módulos sensibles.

### 📊 Exportación y Datos
- **Excel Nativo**: Botones de exportación directa a `.xlsx` implementados en los módulos de Empleados, Dispositivos y Asignaciones.
- **Integridad de Datos**: Scripts de corrección y validación para asegurar la consistencia de la base de datos.
- **Reset de Credenciales**: Mecanismos de recuperación de acceso para administradores (`scripts/reset_password.py`).

### 🎨 Identidad y UI/UX
- **Branding Corporativo**: Inclusión de Isologotipo y logotipos en Sidebar, Login y Favicon.
- **Correcciones de Interfaz**: Solución a problemas de superposición de texto e iconos en formularios modales (`!pl-10`).
- **Navegación Intuitiva**: Menús laterales actualizados y condicionales según el rol del usuario conectado.

### �📄 Generación de Documentos (PDF)
- **Marca Corporativa**: Inclusión de logo oficial en cabeceras de actas.
- **Formato Mejorado**: Ajuste de anchos, inclusión de columnas de fechas y optimización de fuentes.
- **Lógica de Fechas**: Distinción entre fecha de asignación (Entrega) y fecha de generación (Remisión).

### 📱 Gestión de Inventario y Líneas
- **Líneas Libres**: Nueva sección dedicada para visualizar líneas y equipos disponibles listos para asignar.
- **Registro Simplificado**: Opción para registrar "Solo Línea" (SIM Card) sin necesidad de datos de hardware.
- **Historial de Uso**: Visualización del "Último Usuario" en equipos disponibles para rastreo de devoluciones.

### 💰 Control Financiero (Daños/Pérdidas)
- **Cálculo Automático**: Al marcar un equipo como "Dañado/Baja", el sistema calcula el valor residual a cobrar al empleado.
- **Método**: Depreciación lineal a 36 meses basada en la fecha de compra exacta.
- **Alertas Visuales**: Indicadores claros del monto a recuperar en la interfaz de edición.

### 🖥️ Mejoras de Interfaz (Frontend)
- **Vistas Flexibles**: Alternancia entre vista de **Tabla** (lista detallada) y **Cuadrícula** (tarjetas visuales).
- **Búsqueda Avanzada**: Posibilidad de buscar dispositivos por nombre del empleado asignado.
- **Optimización**: Búsqueda fluida (*debounce*) y paginación ampliada.

## �📋 Requisitos Previos

- Docker y Docker Compose
- Python 3.11+
- Node.js 18+ (para el frontend)
- Git

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd sysAdmin
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo para las variables de entorno (si existe) o crea uno nuevo:

```bash
# Backend (raíz)
cp .env.example .env
# Frontend (opcional si hay .env.example)
# cp frontend/.env.example frontend/.env
```

### 3. Levantar base de datos con Docker

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en el puerto **5433** (interno 5432)
- pgAdmin en http://localhost:5051

### 4. Configuración del Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Inicializar base de datos

Desde la raíz del proyecto (sysAdmin):

```bash
# Crear tablas
python -m backend.scripts.init_db

# Crear usuario administrador
python -m backend.scripts.create_admin
```

Alternativamente si estás dentro de la carpeta `backend`:
```bash
python -m scripts.init_db
python -m scripts.create_admin
```

Credenciales del admin por defecto:
- Username: `admin`
- Password: `admin123`

#### Importar datos del Excel (opcional)

```bash
python -m backend.scripts.import_excel
```

#### Iniciar el servidor

```bash
# Desde la raíz del proyecto
uvicorn backend.main:app --reload
```

El backend estará disponible en:
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

### 5. Configuración del Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 📚 Estructura del Proyecto

```
sysAdmin/
├── backend/
│   ├── models/          # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic
│   ├── routers/         # Endpoints de la API
│   ├── services/        # Lógica de negocio
│   ├── scripts/         # Scripts de utilidad
│   ├── static/          # Archivos estáticos (PDFs generados)
│   ├── database.py      # Configuración de BD
│   ├── main.py          # Aplicación FastAPI
│   └── requirements.txt # Dependencias Python
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/      # Imágenes e iconos
│   │   ├── components/  # Componentes reutilizables
│   │   ├── contexts/    # Contextos de React (Auth, etc)
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Vistas de la aplicación
│   │   ├── services/    # Servicios de API (Axios)
│   │   ├── utils/       # Utilidades
│   │   ├── App.jsx      # Componente principal
│   │   └── main.jsx     # Punto de entrada
│   ├── package.json     # Dependencias Node
│   └── vite.config.js   # Configuración Vite
├── docker-compose.yml   # Configuración Docker
├── .env                 # Variables de entorno
└── README.md
```

## 🔐 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso total, gestión de usuarios, dar de baja equipos |
| **RRHH** | Gestión de empleados, dispositivos y asignaciones |
| **Supervisor** | Solo lectura (consultas y reportes) |
| **Contabilidad** | Solo lectura (consultas y reportes) |
| **Auditoría** | Solo lectura (consultas y reportes) |

## 📊 Fórmula de Depreciación

El sistema utiliza depreciación lineal a 36 meses:

```
Depreciación mensual = Costo inicial / 36
Depreciación acumulada = Depreciación mensual × Meses de uso
Valor actual = Costo inicial - Depreciación acumulada
```

## 🔧 Uso

### Acceder a pgAdmin

1. Abrir http://localhost:5051
2. Login con credenciales configuradas en Docker (por defecto admin@admin.com / admin123)
3. Agregar servidor:
   - Host: `postgres` (si usas red interna docker) o `host.docker.internal`
   - Port: 5432
   - Database: device_management
   - Username: admin
   - Password: admin123

### Pruebas

#### Backend
Ir a las documentaciones interactivas (Swagger/ReDoc) para probar los endpoints. Se requiere autenticación Bearer Token (login previo).

#### Frontend
Navegar por la interfaz en http://localhost:5173.
- Login Page
- Dashboard General
- Gestión de Inventario
- Asignación de Equipos

## 📝 Próximos Pasos

- [ ] Completar tests automatizados (Backend/Frontend)
- [ ] Implementar validaciones extra en formularios frontend
- [ ] Mejorar la interfaz de reportes
- [ ] Desplegar en producción (Dockerizar aplicaciones web y api)
- [ ] Integración con proveedor para consumo y geolocalización

## � Despliegue en Servidor Linux (Ubuntu)

Guía paso a paso para desplegar la aplicación en un servidor Ubuntu 22.04/24.04.

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y python3-pip python3-venv nodejs npm nginx git

# Instalar Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Configuración de Base de Datos

```bash
cd /opt
sudo git clone <repository-url> sysAdmin
sudo chown -R $USER:$USER sysAdmin
cd sysAdmin

# Configurar variables de entorno
cp .env.example .env
nano .env # Ajustar contraseñas y dominios

# Levantar contenedores de BD
docker compose up -d
```

### 3. Configuración del Backend (Systemd)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m scripts.init_db
python -m scripts.create_admin
deactivate

# Crear servicio systemd
sudo nano /etc/systemd/system/sysadmin-backend.service
```

Contenido del servicio (`sysadmin-backend.service`):
```ini
[Unit]
Description=Gunicorn process specific configuration for SysAdmin Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/opt/sysAdmin
Environment="PATH=/opt/sysAdmin/backend/venv/bin"
EnvironmentFile=/opt/sysAdmin/.env
ExecStart=/opt/sysAdmin/backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

```bash
# Iniciar servicio
sudo systemctl start sysadmin-backend
sudo systemctl enable sysadmin-backend
```

### 4. Configuración del Frontend (Build Estático)

```bash
cd ../frontend
npm install

# Crear archivo .env de producción
echo "VITE_API_URL=https://api.tudominio.com" > .env.production

# Compilar
npm run build
```

### 5. Configuración de Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/sysadmin
```

Contenido de Nginx:
```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend estático
    location / {
        root /opt/sysAdmin/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        # Si tu backend no tiene prefijo /api, ajusta rewrite:
        # rewrite ^/api/(.*) /$1 break; 
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Documentación Proxy
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
    
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
    }
}
```

```bash
# Activar sitio y reiniciar Nginx
sudo ln -s /etc/nginx/sites-available/sysadmin /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## �🐛 Troubleshooting

### Error de conexión a la base de datos

```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar contenedores
docker-compose down
docker-compose up -d
```

### Puertos Ocupados

Si los puertos 5433 o 5051 están ocupados, edita el archivo `docker-compose.yml` y cambia el mapeo de puertos.

## 📄 Licencia

Propiedad de New Century Builders S.A.

## 👥 Contacto

Para soporte técnico, contactar al Departamento de Informática.
