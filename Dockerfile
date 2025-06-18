# Fase 1: Construir la aplicación Angular
# Usa una imagen de Node.js 20 (basada en Debian) para el proceso de construcción.
FROM node:20 AS build

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Configura opciones para Node.js, útil para evitar problemas de memoria en builds grandes.
ENV NODE_OPTIONS=--max-old-space-size=4096

# Copia solo los archivos package.json y package-lock.json para aprovechar el cache de Docker.
COPY package*.json ./

# Instala 'git'. Algunas dependencias de npm pueden requerir git para su instalación.
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# Limpia la caché de npm para evitar problemas con instalaciones anteriores o corruptas.
RUN npm cache clean --force

# Instala las dependencias de Node.js.
# Usamos --legacy-peer-deps para resolver el conflicto con @ng-select/ng-select.
# IMPORTANTE: Esto permite la instalación, pero se recomienda actualizar @ng-select/ng-select
# a una versión compatible con Angular 19 en tu proyecto local lo antes posible.
RUN npm install --legacy-peer-deps

# Copia el resto del código fuente de la aplicación al directorio de trabajo.
COPY . .

# Genera la build de la aplicación Angular en modo DEVELOPMENT.
# Asume que tu script 'build' en package.json ya configura la salida y la configuración.
RUN npm run build

# *** PASO DE DIAGNÓSTICO: Listar el contenido de la carpeta de salida de Angular ***
RUN echo "Contenido de /app/dist después de la build:"
RUN ls -laR /app/dist

# Fase 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copia tu archivo nginx.conf personalizado.
# ¡IMPORTANTE! Asegúrate de que este archivo SÓLO contiene el bloque 'server { ... }'.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el CONTENIDO de la carpeta 'civigest' a la raíz del servidor web de Nginx.
COPY --from=build /app/dist/civigest/browser/ /usr/share/nginx/html/

# *** PASO DE DIAGNÓSTICO: Listar el contenido de la carpeta de Nginx después de la copia ***
RUN echo "Contenido de /usr/share/nginx/html después de la copia:"
RUN ls -laR /usr/share/nginx/html

# Expone el puerto 80 del contenedor, que es el puerto por defecto de Nginx.
EXPOSE 80

# Comando para iniciar Nginx en primer plano.
CMD ["nginx", "-g", "daemon off;"]
