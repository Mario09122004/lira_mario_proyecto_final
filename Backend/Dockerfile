FROM node:26.5.0-alpine3.24

# Habilitar corepack para usar pnpm
RUN corepack enable

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias del backend
RUN pnpm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 5000

# Comando para ejecutar la app
CMD [ "pnpm", "start" ]
