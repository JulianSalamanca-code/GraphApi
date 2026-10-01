# MrCatFood - GraphApi

API Gateway GraphQL para el sistema de microservicios MrCatFood. El gateway
expone un **contrato unificado** y orquesta cuatro microservicios políglotas con
persistencia en SQLite.

## Arquitectura

```text
                     ┌──────────────────────────┐
                     │  Gateway GraphQL (:3000) │
                     │  contrato unificado      │
                     └───────────┬──────────────┘
                                 │ HTTP (GraphQL)
        ┌───────────────┬────────┴────────┬────────────────┐
        │               │                 │                │
┌───────▼──────┐ ┌──────▼───────┐ ┌───────▼────────┐ ┌─────▼────────┐
│ Usuarios     │ │ Órdenes      │ │ Pedidos        │ │ Pagos        │
│ Java/Spring  │ │ Java/Spring  │ │ NestJS/TypeORM │ │ Flask/Graphene│
│ :3001        │ │ :3002        │ │ :3003          │ │ :3004        │
└──────────────┘ └──────────────┘ └────────────────┘ └──────────────┘
        │               │                 │                │
        └───────────────┴── Consul (:8500) ┴────────────────┘
                        service discovery
```

## Servicios y puertos

| Servicio | Tecnología | Puerto | Descripción |
| -------- | ---------- | ------ | ----------- |
| gateway | Node.js + Apollo Server | 3000 | API Gateway GraphQL |
| usuarios-service | Java Spring Boot | 3001 | Gestión de usuarios |
| ordenes-service | Java Spring Boot | 3002 | Gestión de órdenes |
| pedidos-service | NestJS + TypeORM | 3003 | Gestión de pedidos |
| pagos-service | Python Flask + Graphene | 3004 | Procesamiento de pagos |
| consul | HashiCorp Consul | 8500 | Service Discovery |

## Requisitos

- Docker >= 20.10
- Docker Compose >= 2.0

## Inicio rápido

```bash
docker compose up -d --build      # o: pnpm stack:up
node scripts/wait-for-stack.mjs   # o: pnpm stack:wait
```

Accede a:

- **GraphiQL** (interfaz visual): <http://localhost:3000/graphql>
- **Consul UI**: <http://localhost:8500>

## Comandos útiles

```bash
docker compose ps                 # estado de los contenedores
docker compose logs -f            # logs en vivo
docker compose down               # detener
docker compose down -v            # detener y borrar datos
docker compose build --no-cache   # reconstruir imágenes
```

## Ejemplo de query GraphQL

```graphql
query OrdenCompleta($id: ID!) {
  orden(id: $id) {
    id
    estado
    total
    usuario { id nombre email }
    pedidos { id producto cantidad subtotal }
    pagos { id monto estado }
  }
}
```

## Estructura del proyecto

```text
GraphApi/
├── gateway/               # API Gateway (Apollo Server)
├── services/
│   ├── usuarios-service/  # Spring Boot
│   ├── ordenes-service/   # Spring Boot
│   ├── pedidos-service/   # NestJS
│   └── pagos-service/     # Flask + Graphene
├── consul/                # Configuración de Consul
├── shared/graphql/        # Contrato GraphQL de referencia
├── bruno/                 # Colección de pruebas (49 peticiones)
├── e2e/                   # Pruebas E2E de microservicios
├── docs/                  # Documentación
├── docker-compose.yml
├── .env.example
└── README.md
```

## Pruebas

```bash
# Colección Bruno (49 peticiones con aserciones)
cd bruno && bru run

# E2E de microservicios (requiere el stack arriba)
pnpm test:e2e:micro
```

## Monolito (opcional)

El directorio `src/` contiene una versión monolítica de la misma API (NestJS con
almacenamiento en memoria). Se ejecuta en local con `pnpm start:dev` en el puerto
3000; detén el stack de microservicios antes de arrancarlo.

```bash
pnpm start:dev   # http://localhost:3000/graphql
pnpm test        # unitarios
pnpm test:e2e    # E2E del monolito
```

---

Arquitectura, decisiones y alcance de las pruebas en
[docs/MICROSERVICES.md](docs/MICROSERVICES.md).
