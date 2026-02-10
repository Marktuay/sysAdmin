# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json y lockfile
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Argumento para la URL de la API (para que se "queme" en el build)
# Por defecto lo seteamos relativo para que funcione con el proxy reverso
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puesto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
