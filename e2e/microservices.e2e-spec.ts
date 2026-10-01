import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Certificación E2E del stack de microservicios MrCatFood.
 *
 * Requiere el stack levantado con Docker Compose y accesible en el gateway
 * (por defecto http://localhost:3000). Ejecutar:
 *
 *   docker compose up -d --build
 *   node scripts/wait-for-stack.mjs
 *   pnpm test:e2e:micro
 */

const GATEWAY_HTTP = process.env.GATEWAY_HTTP_URL ?? 'http://localhost:3000';
const GATEWAY = `${GATEWAY_HTTP}/graphql`;
const SERVICIOS = [
  { nombre: 'gateway', url: `${GATEWAY_HTTP}/health` },
  { nombre: 'usuarios-service', url: 'http://localhost:3001/actuator/health' },
  { nombre: 'ordenes-service', url: 'http://localhost:3002/actuator/health' },
  { nombre: 'pedidos-service', url: 'http://localhost:3003/health' },
  { nombre: 'pagos-service', url: 'http://localhost:3004/health' },
];

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

interface Orden {
  id: string;
  estado: string;
  usuarioId: string;
  total: number;
}

interface Pedido {
  id: string;
  producto: string;
  descripcion: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  usuarioId: string;
  ordenId: string;
}

interface Pago {
  id: string;
  monto: number;
  metodo: string;
  estado: string;
  referencia: string | null;
  ordenId: string;
}

interface GraphQLResult<T> {
  status: number;
  data: T | null;
  errors: Array<{ message: string }> | null;
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<GraphQLResult<T>> {
  const respuesta = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await respuesta.json()) as {
    data?: T | null;
    errors?: Array<{ message: string }> | null;
  };
  return {
    status: respuesta.status,
    data: body.data ?? null,
    errors: body.errors ?? null,
  };
}

async function ok<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const resultado = await gql<T>(query, variables);
  if (resultado.errors && resultado.errors.length > 0) {
    throw new Error(`GraphQL errors: ${JSON.stringify(resultado.errors)}`);
  }
  return resultado.data as T;
}

function emailUnico(prefijo: string): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function crearUsuario(nombre: string, email: string): Promise<Usuario> {
  const data = await ok<{ crearUsuario: Usuario }>(
    `mutation ($input: CrearUsuarioInput!) {
       crearUsuario(input: $input) { id nombre email telefono activo creadoEn actualizadoEn }
     }`,
    { input: { nombre, email } },
  );
  return data.crearUsuario;
}

let usuario: Usuario;
let usuario2: Usuario;
let orden: Orden;
let pedido1: Pedido;
let pedido2: Pedido;
let pago: Pago;

describe('Infraestructura y salud del stack', () => {
  it('el gateway responde Hello World en la raíz', async () => {
    const respuesta = await fetch(`${GATEWAY_HTTP}/`);
    expect(respuesta.status).toBe(200);
    expect(await respuesta.text()).toContain('Hello World!');
  });

  it('los cinco servicios exponen un healthcheck OK', async () => {
    for (const servicio of SERVICIOS) {
      const respuesta = await fetch(servicio.url, {
        signal: AbortSignal.timeout(5000),
      });
      expect(respuesta.ok, `${servicio.nombre} no responde OK`).toBe(true);
    }
  });

  it('el gateway expone un esquema GraphQL con introspección', async () => {
    const resultado = await gql<{ __schema: { queryType: { name: string } } }>(
      `query { __schema { queryType { name } } }`,
    );
    expect(resultado.errors).toBeNull();
    expect(resultado.data?.__schema.queryType.name).toBe('Query');
  });
});

describe('Flujo completo certificado (gateway -> 4 microservicios -> SQLite)', () => {
  beforeAll(async () => {
    usuario = await crearUsuario('Usuario E2E', emailUnico('e2e'));
    usuario2 = await crearUsuario('Usuario Ajeno', emailUnico('ajeno'));

    orden = (
      await ok<{ crearOrden: Orden }>(
        `mutation ($input: CrearOrdenInput!) {
           crearOrden(input: $input) { id estado usuarioId total }
         }`,
        { input: { usuarioId: usuario.id } },
      )
    ).crearOrden;

    pedido1 = (
      await ok<{ crearPedido: Pedido }>(
        `mutation ($input: CrearPedidoInput!) {
           crearPedido(input: $input) {
             id producto descripcion cantidad precioUnitario subtotal usuarioId ordenId
           }
         }`,
        {
          input: {
            producto: 'Comida para gatos',
            descripcion: 'Paquete premium',
            cantidad: 3,
            precioUnitario: 12.5,
            usuarioId: usuario.id,
            ordenId: orden.id,
          },
        },
      )
    ).crearPedido;

    pedido2 = (
      await ok<{ crearPedido: Pedido }>(
        `mutation ($input: CrearPedidoInput!) {
           crearPedido(input: $input) { id producto cantidad subtotal usuarioId ordenId }
         }`,
        {
          input: {
            producto: 'Juguete',
            cantidad: 1,
            precioUnitario: 5,
            usuarioId: usuario.id,
            ordenId: orden.id,
          },
        },
      )
    ).crearPedido;

    pago = (
      await ok<{ crearPago: Pago }>(
        `mutation ($input: CrearPagoInput!) {
           crearPago(input: $input) { id monto metodo estado referencia ordenId }
         }`,
        {
          input: {
            monto: 20,
            metodo: 'TARJETA',
            estado: 'APROBADO',
            referencia: 'REF-001',
            ordenId: orden.id,
          },
        },
      )
    ).crearPago;
  });

  afterAll(async () => {
    // Limpieza tolerante: se eliminan dependencias antes que las entidades padre.
    const limpieza = `
      mutation ($pagoId: ID!, $pedido1: ID!, $pedido2: ID!, $ordenId: ID!, $usuarioId: ID!) {
        eliminarPago(id: $pagoId)
        eliminarPedido(id: $pedido1)
        eliminarSegundoPedido: eliminarPedido(id: $pedido2)
        eliminarOrden(id: $ordenId)
        eliminarUsuario(id: $usuarioId)
      }
    `;
    if (usuario && orden) {
      await gql(limpieza, {
        pagoId: pago?.id,
        pedido1: pedido1?.id,
        pedido2: pedido2?.id,
        ordenId: orden?.id,
        usuarioId: usuario?.id,
      }).catch(() => undefined);
    }
    if (usuario2?.id) {
      await gql(`mutation ($id: ID!) { eliminarUsuario(id: $id) }`, {
        id: usuario2.id,
      }).catch(() => undefined);
    }
  });

  it('crea el usuario, normaliza el email y asigna valores por defecto', () => {
    expect(usuario.id).toBeTruthy();
    expect(usuario.email).toBe(usuario.email.toLowerCase());
    expect(usuario.activo).toBe(true);
    expect(usuario.creadoEn).toBeTruthy();
    expect(usuario.actualizadoEn).toBeTruthy();
  });

  it('rechaza emails duplicados con el mensaje de conflicto', async () => {
    const resultado = await gql(`mutation ($input: CrearUsuarioInput!) {
      crearUsuario(input: $input) { id }
    }`, { input: { nombre: 'Duplicado', email: usuario.email } });
    expect(resultado.errors?.[0]?.message).toBe('Ya existe un usuario con ese email.');
  });

  it('rechaza emails inválidos y nombres vacíos con Bad Request', async () => {
    const emailInvalido = await gql(
      `mutation ($input: CrearUsuarioInput!) { crearUsuario(input: $input) { id } }`,
      { input: { nombre: 'X', email: 'no-es-un-email' } },
    );
    expect(emailInvalido.errors?.[0]?.message).toContain('Bad Request');

    const nombreVacio = await gql(
      `mutation ($input: CrearUsuarioInput!) { crearUsuario(input: $input) { id } }`,
      { input: { nombre: '   ', email: emailUnico('vacio') } },
    );
    expect(nombreVacio.errors?.[0]?.message).toContain('Bad Request');
  });

  it('crea la orden en estado PENDIENTE con total 0', () => {
    expect(orden.estado).toBe('PENDIENTE');
    expect(orden.usuarioId).toBe(usuario.id);
    expect(orden.total).toBe(0);
  });

  it('calcula el subtotal de cada pedido', () => {
    expect(pedido1.subtotal).toBe(37.5);
    expect(pedido2.subtotal).toBe(5);
  });

  it('crea el pago con estado explícito', () => {
    expect(pago.estado).toBe('APROBADO');
    expect(pago.metodo).toBe('TARJETA');
    expect(pago.ordenId).toBe(orden.id);
  });

  it('resuelve las relaciones y el total de la orden a través del gateway', async () => {
    const data = await ok<{
      orden: {
        id: string;
        total: number;
        estado: string;
        usuarioId: string;
        usuario: { id: string; email: string };
        pedidos: {
          id: string;
          producto: string;
          cantidad: number;
          subtotal: number;
          usuario: { email: string };
        }[];
        pagos: { id: string; monto: number; estado: string; orden: { id: string } }[];
      };
      usuario: { id: string; pedidos: { id: string }[]; ordenes: { id: string }[] };
      pedidos: { id: string }[];
      pagos: { id: string }[];
      pedidosPorUsuario: { id: string }[];
      pagosPorOrden: { id: string }[];
      pedidosSinFiltro: { id: string }[];
      pagosSinFiltro: { id: string }[];
    }>(
      `query ($ordenId: ID!, $usuarioId: ID!) {
        orden(id: $ordenId) {
          id total estado usuarioId
          usuario { id email }
          pedidos { id producto cantidad subtotal usuario { email } }
          pagos { id monto estado orden { id } }
        }
        usuario(id: $usuarioId) { id pedidos { id } ordenes { id } }
        pedidos { id }
        pagos { id }
        pedidosPorUsuario: pedidos(usuarioId: $usuarioId) { id }
        pagosPorOrden: pagos(ordenId: $ordenId) { id }
        pedidosSinFiltro: pedidos(usuarioId: null) { id }
        pagosSinFiltro: pagos(ordenId: null) { id }
      }`,
      { ordenId: orden.id, usuarioId: usuario.id },
    );

    expect(data.orden.total).toBe(42.5);
    expect(data.orden.usuario.email).toBe(usuario.email);
    expect(data.orden.pedidos).toHaveLength(2);
    expect(data.orden.pedidos[0].usuario.email).toBe(usuario.email);
    expect(data.orden.pagos).toHaveLength(1);
    expect(data.orden.pagos[0].orden.id).toBe(orden.id);
    expect(data.usuario.ordenes.map((o) => o.id)).toContain(orden.id);
    expect(data.usuario.pedidos).toHaveLength(2);
    expect(data.pedidosPorUsuario).toHaveLength(2);
    expect(data.pagosPorOrden).toHaveLength(1);
    expect(data.pedidosSinFiltro.length).toBeGreaterThanOrEqual(2);
    expect(data.pagosSinFiltro.length).toBeGreaterThanOrEqual(1);
  });

  it('actualiza las entidades y recalcula los totales', async () => {
    const actualizacion = await ok<{
      actualizarUsuario: { nombre: string; activo: boolean };
      actualizarOrden: { estado: string };
      actualizarPedido: { cantidad: number; subtotal: number };
      actualizarPago: { monto: number };
    }>(
      `mutation ($usuarioId: ID!, $ordenId: ID!, $pedidoId: ID!, $pagoId: ID!) {
        actualizarUsuario(id: $usuarioId, input: { nombre: "Usuario E2E Actualizado", activo: false }) { nombre activo }
        actualizarOrden(id: $ordenId, input: { estado: PAGADA }) { estado }
        actualizarPedido(id: $pedidoId, input: { cantidad: 4 }) { cantidad subtotal }
        actualizarPago(id: $pagoId, input: { monto: 55, estado: REEMBOLSADO }) { monto estado }
      }`,
      { usuarioId: usuario.id, ordenId: orden.id, pedidoId: pedido1.id, pagoId: pago.id },
    );

    expect(actualizacion.actualizarUsuario).toEqual({
      nombre: 'Usuario E2E Actualizado',
      activo: false,
    });
    expect(actualizacion.actualizarOrden.estado).toBe('PAGADA');
    expect(actualizacion.actualizarPedido.subtotal).toBe(50);

    const ordenActualizada = await ok<{
      orden: { total: number; estado: string; pagos: { monto: number }[] };
    }>(
      `query ($id: ID!) { orden(id: $id) { total estado pagos { monto } } }`,
      { id: orden.id },
    );
    expect(ordenActualizada.orden.total).toBe(55);
    expect(ordenActualizada.orden.estado).toBe('PAGADA');
    expect(ordenActualizada.orden.pagos[0].monto).toBe(55);
  });

  it('mueve un pedido a otra orden y recalcula ambos totales', async () => {
    const segundaOrden = (
      await ok<{ crearOrden: Orden }>(
        `mutation ($input: CrearOrdenInput!) { crearOrden(input: $input) { id estado total } }`,
        { input: { usuarioId: usuario.id } },
      )
    ).crearOrden;

    await ok(
      `mutation ($id: ID!, $ordenId: ID!) {
        actualizarPedido(id: $id, input: { ordenId: $ordenId }) { id ordenId }
      }`,
      { id: pedido2.id, ordenId: segundaOrden.id },
    );

    const totales = await ok<{
      primera: { total: number; pedidos: { id: string }[] };
      segunda: { total: number; pedidos: { id: string }[] };
    }>(
      `query ($a: ID!, $b: ID!) {
        primera: orden(id: $a) { total pedidos { id } }
        segunda: orden(id: $b) { total pedidos { id } }
      }`,
      { a: orden.id, b: segundaOrden.id },
    );

    expect(totales.primera.total).toBe(50);
    expect(totales.primera.pedidos.map((p) => p.id)).toEqual([pedido1.id]);
    expect(totales.segunda.total).toBe(5);
    expect(totales.segunda.pedidos.map((p) => p.id)).toEqual([pedido2.id]);

    // Devolver el pedido a la orden original y eliminar la orden ya vacía.
    await ok(
      `mutation ($id: ID!, $ordenId: ID!) {
        actualizarPedido(id: $id, input: { ordenId: $ordenId }) { id ordenId }
      }`,
      { id: pedido2.id, ordenId: orden.id },
    );
    await ok(`mutation ($id: ID!) { eliminarOrden(id: $id) }`, {
      id: segundaOrden.id,
    });
  });

  it('rechaza un pedido cuyo usuario no es el propietario de la orden', async () => {
    const resultado = await gql(
      `mutation ($input: CrearPedidoInput!) { crearPedido(input: $input) { id } }`,
      {
        input: {
          producto: 'Producto ajeno',
          cantidad: 1,
          precioUnitario: 10,
          usuarioId: usuario2.id,
          ordenId: orden.id,
        },
      },
    );
    expect(resultado.errors?.[0]?.message).toContain('propietario');
  });

  it('rechaza un pedido con orden inexistente mencionando la orden', async () => {
    const resultado = await gql(
      `mutation ($input: CrearPedidoInput!) { crearPedido(input: $input) { id } }`,
      {
        input: {
          producto: 'Producto huérfano',
          cantidad: 1,
          precioUnitario: 10,
          usuarioId: usuario.id,
          ordenId: randomUUID(),
        },
      },
    );
    expect(resultado.errors?.[0]?.message).toContain('Orden con id');
  });

  it('rechaza mover un pedido a una orden inexistente', async () => {
    const resultado = await gql(
      `mutation ($id: ID!, $ordenId: ID!) {
        actualizarPedido(id: $id, input: { ordenId: $ordenId }) { id }
      }`,
      { id: pedido1.id, ordenId: randomUUID() },
    );
    expect(resultado.errors?.[0]?.message).toContain('Orden con id');
  });

  it('reporta errores por entidad inexistente sin tumbar la consulta', async () => {
    const id = randomUUID();
    const resultado = await gql<{ usuarios: { id: string }[] }>(
      `query ($id: ID!) {
        usuario(id: $id) { id }
        orden(id: $id) { id }
        pedido(id: $id) { id }
        pago(id: $id) { id }
        usuarios { id }
      }`,
      { id },
    );
    expect(resultado.errors?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(resultado.data?.usuarios)).toBe(true);
  });

  it('impide eliminar una orden con pedidos asociados', async () => {
    const resultado = await gql(
      `mutation ($id: ID!) { eliminarOrden(id: $id) }`,
      { id: orden.id },
    );
    expect(resultado.errors?.[0]?.message).toContain('pedidos asociados');
  });

  it('impide eliminar un usuario con órdenes o pedidos', async () => {
    const resultado = await gql(
      `mutation ($id: ID!) { eliminarUsuario(id: $id) }`,
      { id: usuario.id },
    );
    expect(resultado.errors?.[0]?.message).toContain('órdenes o pedidos');
  });

  it('elimina las dependencias y luego las entidades padre', async () => {
    const data = await ok<Record<string, boolean>>(
      `mutation ($pagoId: ID!, $pedido1: ID!, $pedido2: ID!, $ordenId: ID!, $usuarioId: ID!, $usuario2Id: ID!) {
        eliminarPago(id: $pagoId)
        eliminarPedido(id: $pedido1)
        eliminarSegundoPedido: eliminarPedido(id: $pedido2)
        eliminarOrden(id: $ordenId)
        eliminarUsuario(id: $usuarioId)
        eliminarUsuario2: eliminarUsuario(id: $usuario2Id)
      }`,
      {
        pagoId: pago.id,
        pedido1: pedido1.id,
        pedido2: pedido2.id,
        ordenId: orden.id,
        usuarioId: usuario.id,
        usuario2Id: usuario2.id,
      } as Record<string, unknown>,
    );
    expect(data.eliminarPago).toBe(true);
    expect(data.eliminarPedido).toBe(true);
    expect(data.eliminarOrden).toBe(true);
    expect(data.eliminarUsuario).toBe(true);
  });
});

describe('Persistencia real en SQLite', () => {
  it('los datos sobreviven al reinicio del microservicio', async () => {
    const persistente = await crearUsuario('Usuario Persistente', emailUnico('persist'));

    try {
      execSync('docker compose restart usuarios-service', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 120_000,
      });

      // Esperar a que el servicio vuelva a estar sano.
      const limite = Date.now() + 120_000;
      let sano = false;
      while (Date.now() < limite) {
        try {
          const respuesta = await fetch(
            'http://localhost:3001/actuator/health',
            { signal: AbortSignal.timeout(3000) },
          );
          if (respuesta.ok) {
            sano = true;
            break;
          }
        } catch {
          // reintentar
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      expect(sano).toBe(true);

      const recuperado = await ok<{ usuario: Usuario }>(
        `query ($id: ID!) { usuario(id: $id) { id email } }`,
        { id: persistente.id },
      );
      expect(recuperado.usuario.email).toBe(persistente.email);
    } finally {
      await gql(`mutation ($id: ID!) { eliminarUsuario(id: $id) }`, {
        id: persistente.id,
      }).catch(() => undefined);
    }
  });
});
