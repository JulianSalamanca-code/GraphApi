# MrCatFood - GraphApi

API Gateway GraphQL para el sistema de microservicios MrCatFood, construido con WunderGraph Cosmo Router.

## Arquitectura

MrCatFood utiliza una arquitectura de microservicios con un API Gateway GraphQL centralizado:

```
                    ┌─────────────────┐
                    │  Cosmo Router   │
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

| Servicio | Tecnología | Puerto | Descripción |
|----------|-----------|--------|-------------|
| cosmo-router | WunderGraph Cosmo | 3000 | API Gateway GraphQL |
| usuarios-service | Java Spring Boot | 3001 | Gestión de usuarios |
| ordenes-service | Java Spring Boot | 3002 | Gestión de órdenes |
| pedidos-service | NestJS | 3003 | Gestión de pedidos |
| pagos-service | Python Flask | 3004 | Procesamiento de pagos |
| consul | HashiCorp Consul | 8500 | Service Discovery |

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
   - **GraphQL Playground**: http://localhost:3000
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
query GetUsuarioConPedidos($id: ID!) {
  usuario(id: $id) {
    id
    nombre
    email
    pedidos {
      id
      estado
      total
      fechaCreacion
    }
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
├── cosmo/
│   └── config.yaml          # Configuración del router
├── services/
│   ├── usuarios/            # Spring Boot
│   ├── ordenes/             # Spring Boot
│   ├── pedidos/             # NestJS
│   └── pagos/               # Flask
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

## Certificación E2E de microservicios

El stack completo (gateway + 4 microservicios + SQLite) se levanta y se certifica con:

```bash
pnpm stack:up        # docker compose up -d --build
pnpm stack:wait      # espera a que los 5 servicios estén healthy
pnpm test:e2e:micro  # pruebas E2E certificadas contra el gateway
pnpm stack:down      # detiene y elimina los volúmenes
```

Arquitectura, correcciones de base de datos y alcance de las pruebas en
[docs/MICROSERVICES.md](docs/MICROSERVICES.md).