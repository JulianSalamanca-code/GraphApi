# Proyecto MrCatFood - Microservicios GraphQL

## Descripción
Sistema de microservicios para gestión de pedidos, usuarios, ordenes y pagos usando GraphQL con Apollo Gateway.

## Arquitectura

```
                    ┌─────────────────────────┐
                    │   Apollo Gateway        │
                    │   Puerto: 3000          │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Consul              │
                    │   Service Discovery   │
                    │   Puerto: 8500        │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
 ┌──────▼──────┐       ┌───────▼───────┐       ┌───────▼───────┐
 │ Java        │       │ TypeScript    │       │ Python        │
 │ Spring Boot │       │ NestJS        │       │ Flask         │
 │ :3001       │       │ :3003         │       │ :3004         │
 │             │       │               │       │               │
 │ Usuarios    │       │ Pedidos       │       │ Pagos         │
 │ Ordenes     │       │               │       │               │
 └─────────────┘       └───────────────┘       └───────────────┘
```

## Estructura de Archivos

```
GraphApi/
├── docker-compose.yml              # Orquestación completa
├── .env.example                    # Variables de entorno
├── .gitignore                      # Exclusiones
├── README.md                       # Documentación
│
├── gateway/                        # Apollo Gateway
│   ├── src/
│   │   └── main.ts                 # Configuración del gateway
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── services/                       # 4 Microservicios
│   ├── usuarios-service/           # Java Spring Boot :3001
│   │   ├── src/main/java/com/mrcatusuarios/
│   │   │   ├── UsuariosServiceApplication.java
│   │   │   ├── model/Usuario.java
│   │   │   ├── repository/UsuarioRepository.java
│   │   │   ├── service/UsuariosService.java
│   │   │   └── graphql/UsuariosResolver.java
│   │   ├── pom.xml
│   │   └── Dockerfile
│   │
│   ├── ordenes-service/            # Java Spring Boot :3002
│   │   ├── src/main/java/com/mrcatordenes/
│   │   │   ├── OrdenesServiceApplication.java
│   │   │   ├── model/Orden.java
│   │   │   ├── repository/OrdenRepository.java
│   │   │   ├── service/OrdenesService.java
│   │   │   └── graphql/OrdenesResolver.java
│   │   ├── pom.xml
│   │   └── Dockerfile
│   │
│   ├── pedidos-service/            # NestJS :3003
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── pedidos.model.ts
│   │   │   ├── pedidos.service.ts
│   │   │   ├── pedidos.resolver.ts
│   │   │   ├── pedidos.module.ts
│   │   │   └── health.controller.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── Dockerfile
│   │
│   └── pagos-service/              # Python Flask :3004
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── models.py
│       │   ├── routes.py
│       │   ├── graphql_schema.py
│       │   └── consul_client.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── shared/                         # Código compartido
│   └── graphql/
│       ├── datetime.graphql
│       ├── usuarios.graphql
│       ├── ordenes.graphql
│       ├── pedidos.graphql
│       └── pagos.graphql
│
├── consul/
│   └── config.json
│
├── bruno/                          # Colecciones de pruebas
│   ├── bruno.json
│   ├── 00 - Informacion/
│   ├── 01 - Usuarios/
│   ├── 02 - Ordenes/
│   ├── 03 - Pedidos/
│   ├── 04 - Pagos/
│   ├── 05 - Flujo completo/
│   └── 06 - Errores esperados/
│
├── docs/                           # Documentación
└── src/                            # Código original (monolito)
```

## Tecnologías

| Servicio | Stack | Puerto |
|----------|-------|--------|
| **Gateway** | Apollo Gateway + Express | 3000 |
| **Usuarios** | Java 17 + Spring Boot 3.2 + GraphQL | 3001 |
| **Ordenes** | Java 17 + Spring Boot 3.2 + GraphQL | 3002 |
| **Pedidos** | TypeScript + NestJS 10 + GraphQL | 3003 |
| **Pagos** | Python 3.12 + Flask + Graphene | 3004 |
| **Discovery** | Consul | 8500 |

## Comandos

### Levantar todo
```bash
docker-compose down
docker-compose up --build
```

### Verificar estado
```bash
docker-compose ps
```

### Ver logs
```bash
docker-compose logs -f
```

### Detener todo
```bash
docker-compose down
```

## Endpoints

| Servicio | URL |
|----------|-----|
| **Gateway** | `http://localhost:3000/graphql` |
| **Consul UI** | `http://localhost:8500` |
| **Usuarios** | `http://localhost:3001/graphql` |
| **Ordenes** | `http://localhost:3002/graphql` |
| **Pedidos** | `http://localhost:3003/graphql` |
| **Pagos** | `http://localhost:3004/graphql` |

## Pruebas en Bruno

1. Abre Bruno
2. Importa la colección desde `bruno/bruno.json`
3. URL base: `http://localhost:3000/graphql`
4. Ejecuta en orden:
   - `00 - Informacion` → Healthcheck
   - `01 - Usuarios` → CRUD usuarios
   - `02 - Ordenes` → CRUD ordenes
   - `03 - Pedidos` → CRUD pedidos
   - `04 - Pagos` → CRUD pagos
   - `05 - Flujo completo` → Flujo integrado
   - `06 - Errores esperados` → Casos de error

## Variables de Entorno

```env
CONSUL_HOST=consul
DB_PATH=/data
PORT=3000
```

## Notas Importantes

- Todos los servicios usan SQLite como base de datos
- Los datos persisten en volúmenes Docker
- El gateway usa Apollo Gateway con federation
- Consul se usa para service discovery
- Los healthchecks usan `curl` (instalado en todos los Dockerfiles)
- La carpeta `cosmo/` ya no se usa (reemplazada por Apollo Gateway)
