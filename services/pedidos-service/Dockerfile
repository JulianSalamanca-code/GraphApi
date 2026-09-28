FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Crear directorio para SQLite con permisos correctos
RUN mkdir -p /data && chmod 777 /data

EXPOSE 3003
CMD ["node", "dist/main"]
