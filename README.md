# MrCatFood - GraphApi

API Gateway GraphQL para el sistema de microservicios MrCatFood, construido con Apollo Server.

## Arquitectura

MrCatFood utiliza una arquitectura de microservicios con un API Gateway GraphQL centralizado:

```
                    ┌─────────────────┐
                    │  Apollo Gateway │
                    │   (GraphQL)     │
                    │   Puerto 3000   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
    │ usuarios-svc   │ │ordenes-svc│ │ pedidos-svc  │
    │ (Spring Boot)  │ │(Spring)   │ │  (NestJS)    │
    │ Puerto 3001    │ │Puerto 3002│ │ Puerto 3003  │
    └────────────────┘ └───────────┘ └──────────────┘
                             │
                    ┌────────▼────────┐
                    │  pagos-service  │
                    │    (Flask)      │
                    │  Puerto 3004    │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Consul      │
                    │ Service Discovery│
                    │  Puerto 8500    │
                    └─────────────────┘
```

## Servicios y Puertos

| Servicio | Tecnología | Puerto | Base de datos | Descripción |
|----------|-----------|--------|---------------|-------------|
| apollo-gateway | Node.js + Apollo Server | 3000 | - | API Gateway GraphQL |
| usuarios-service | Java Spring Boot | 3001 | SQLite | Gestión de usuarios |
| ordenes-service | Java Spring Boot | 3002 | SQLite | Gestión de órdenes |
| pedidos-service | NestJS | 3003 | SQLite | Gestión de pedidos |
| pagos-service | Python Flask | 3004 | SQLite | Procesamiento de pagos |
| consul | HashiCorp Consul | 8500 | - | Service Discovery |

## Requisitos

- Docker >= 20.10
- Docker Compose >= 2.0

## Inicio rápido

1. Clona el repositorio:
   ```bash
   git clone <repo-url>
   cd GraphApi
   ```

2. Crea el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Levanta todos los servicios:
   ```bash
   docker-compose up -d
   ```

4. Verifica que los servicios estén corriendo:
   ```bash
   docker-compose ps
   ```

5. Accede a:
   - **GraphQL Playground**: http://localhost:3000/graphql
   - **Consul UI**: http://localhost:8500

## Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f usuarios-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (borra datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache
```

## Ejemplo de query GraphQL

```graphql
query GetUsuario($id: ID!) {
  usuario(id: $id) {
    id
    nombre
    email
  }
}
```

Variables:
```json
{
  "id": "usr_001"
}
```

## Estructura del proyecto

```
GraphApi/
├── consul/
│   └── config.json          # Configuración de Consul
├── services/
│   ├── usuarios-service/    # Spring Boot + SQLite
│   ├── ordenes-service/     # Spring Boot + SQLite
│   ├── pedidos-service/     # NestJS + SQLite
│   └── pagos-service/       # Flask + SQLite
├── gateway/                 # Apollo Server + Apollo Gateway
│   └── src/
│       └── main.ts          # Gateway con orquestación
├── bruno/                   # Colección de tests
│   ├── 00 - Informacion/
│   ├── 01 - Usuarios/
│   ├── 02 - Ordenes/
│   ├── 03 - Pedidos/
│   ├── 04 - Pagos/
│   ├── 05 - Flujo completo/
│   └── 06 - Errores esperados/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Desarrollo

Cada servicio tiene su propio directorio bajo `services/` con su Dockerfile y código fuente correspondiente. Para desarrollar un servicio individual:

```bash
cd services/<servicio>
# Sigue las instrucciones del README de cada servicio
```

## Tests

La colección de Bruno en `bruno/` contiene pruebas para todos los servicios:

```bash
# Importar la colección en Bruno y ejecutar
# o usar la CLI de Bruno
bru run bruno/
```
