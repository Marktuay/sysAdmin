# Usar imagen base de Python ligera
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
# libpq-dev y gcc son necesarios para psycopg2 si se compila, aunque usaremos psycopg2-binary
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto dentro de una carpeta backend para respetar los imports
COPY . /app/backend

# Configurar PYTHONPATH para que encuentre el paquete backend
ENV PYTHONPATH=/app

# Exponer el puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
