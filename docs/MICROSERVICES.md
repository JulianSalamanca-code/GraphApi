# Microservicios MrCatFood

Arquitectura distribuida que expone el mismo contrato GraphQL documentado en
[`docs/API.md`](API.md) y [`docs/schema.gql`](schema.gql), pero implementada con
cuatro microservicios políglotas y un gateway GraphQL.

## Topología

```text
                      ┌──────────────────────────┐
                      │  Gateway GraphQL (:3000) │
                      │  contrato unificado       │
                      └────────────┬─────────────┘
                                   │ HTTP (GraphQL)
        ┌───────────────┬──────────┴────────┬────────────────┐
        │               │                   │                │
┌───────▼──────┐ ┌──────▼───────┐  ┌────────▼───────┐ ┌──────▼───────┐
│ Usuarios     │ │ Órdenes      │  │ Pedidos        │ │ Pagos        │
│ Java/Spring  │ │ Java/Spring  │  │ NestJS/TypeORM │ │ Flask/Graphene│
│ :3001        │ │ :3002        │  │ :3003          │ │ :3004        │
│ SQLite       │ │ SQLite       │  │ SQLite         │ │ SQLite       │
└──────────────┘ └──────────────┘  └────────────────┘ └──────────────┘
        │               │                   │                │
        └───────────────┴───────── Consul (:8500) ────────────┘
                              service discovery
```

| Componente | Stack | Puerto | Persistencia |
| ---------- | ----- | ------ | ------------ |
| Gateway    | Apollo Server + `@graphql-tools/schema` | 3000 | — |
| Usuarios   | Java 17 + Spring Boot 3.2 + Spring GraphQL | 3001 | SQLite `/data/usuarios.db` |
| Órdenes    | Java 17 + Spring Boot 3.2 + Spring GraphQL | 3002 | SQLite `/data/ordenes.db` |
| Pedidos    | NestJS 10 + TypeORM + better-sqlite3 | 3003 | SQLite `/data/pedidos.db` |
| Pagos      | Python 3.12 + Flask + Graphene | 3004 | SQLite `/data/pagos.db` |
| Discovery  | Consul | 8500 | — |

Cada servicio expone su propio `/graphql` y un healthcheck:

- `GET /actuator/health` en servicios Spring.
- `GET /health` en los servicios NestJS y Flask.

## Contrato unificado

El gateway expone **todas** las operaciones del contrato del monolito:

- `usuarios`, `usuario(id)`, `crearUsuario(input)`, `actualizarUsuario(id, input)`, `eliminarUsuario(id)`
- `ordenes`, `orden(id)`, `crearOrden(input)`, `actualizarOrden(id, input)`, `eliminarOrden(id)`
- `pedidos(usuarioId, ordenId)`, `pedido(id)`, `crearPedido(input)`, `actualizarPedido(id, input)`, `eliminarPedido(id)`
- `pagos(ordenId)`, `pago(id)`, `crearPago(input)`, `actualizarPago(id, input)`, `eliminarPago(id)`

Incluye los campos de relación (`orden.usuario`, `orden.pedidos`, `orden.pagos`,
`usuario.ordenes`, `usuario.pedidos`, `pedido.usuario`, `pedido.orden`, `pago.orden`),
las enumeraciones (`EstadoOrden`, `EstadoPago`, `MetodoPago`) y el scalar `DateTime`.

El contrato de referencia de cada subgrafo está en [`shared/graphql/`](../shared/graphql).

## Decisiones de diseño

### ¿Por qué el gateway no usa Apollo Federation?

Apollo Gateway con `IntrospectAndCompose` requiere que **cada** subgrafo sea un
subgrafo Federation (`_service`, directivas `@key`). Spring GraphQL y Graphene no
soportan Federation de forma nativa, por lo que la composición fallaba y el
gateway no arrancaba.

El gateway actual:

1. Construye el esquema con `makeExecutableSchema` a partir del contrato unificado.
2. Resuelve las operaciones raíz delegando por HTTP en el microservicio dueño.
3. Resuelve los campos de relación consultando al servicio correspondiente.
4. Centraliza las reglas de integridad entre agregados (propietario de la orden,
   protección de borrados, existencia de órdenes) que antes no podía validar
   ningún servicio de forma aislada.

Los archivos `cosmo/` quedaron obsoletos y se conservan solo como referencia.

### Correcciones de conexión a base de datos

- `DB_PATH` es el **directorio** de datos. Cada servicio deriva su fichero:
  - Java: `jdbc:sqlite:${DB_PATH:/data}/<servicio>.db`
  - NestJS: `${DB_PATH:./data}/pedidos.db`
  - Python: `sqlite:///{DB_PATH}/pagos.db`
- Los Dockerfiles de los servicios Java ahora crean `/data` (`mkdir -p /data`).
- `pedidos-service` recibe `DB_PATH=/data` y volumen propio (`pedidos-data`).
- NestJS y Python crean el directorio en el arranque si no existe
  (`mkdirSync` / `os.makedirs`), evitando fallos con rutas inexistentes.
- Los cuatro volúmenes (`usuarios-data`, `ordenes-data`, `pedidos-data`,
  `pagos-data`) garantizan persistencia entre reinicios.

## Ejecución

```bash
docker compose up -d --build      # levantamiento (equivalente a pnpm stack:up)
node scripts/wait-for-stack.mjs   # espera a que todo esté healthy
```

| Recurso | URL |
| ------- | --- |
| Gateway GraphQL | http://localhost:3000/graphql |
| Consul UI | http://localhost:8500 |
| Usuarios | http://localhost:3001/graphql |
| Órdenes | http://localhost:3002/graphql |
| Pedidos | http://localhost:3003/graphql |
| Pagos | http://localhost:3004/graphql |

```bash
docker compose down -v            # detiene y elimina volúmenes
```

## Pruebas E2E

La certificación E2E ejercita el stack completo a través del gateway y comprueba:

- Salud de los cinco servicios.
- Flujo CRUD completo con relaciones y totales.
- Filtros opcionales (incluido `null`).
- Normalización de email, duplicados y validaciones (`Bad Request`).
- Reglas de propiedad, órdenes inexistentes y protección de borrados.
- **Persistencia real**: crea un usuario, reinicia `usuarios-service` y verifica
  que el dato sobrevive al reinicio.

```bash
docker compose up -d --build
node scripts/wait-for-stack.mjs
pnpm test:e2e:micro
```

El spec está en [`e2e/microservices.e2e-spec.ts`](../e2e/microservices.e2e-spec.ts)
y usa `vitest.config.microservices.ts`.
