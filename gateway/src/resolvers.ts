import { GraphQLError } from 'graphql';
import { callService } from './client';

const USUARIO_FIELDS = `
  id
  nombre
  email
  telefono
  activo
  creadoEn
  actualizadoEn
`;

const ORDEN_FIELDS = `
  id
  estado
  usuarioId
  total
  creadoEn
  actualizadoEn
`;

const PEDIDO_FIELDS = `
  id
  producto
  descripcion
  cantidad
  precioUnitario
  subtotal
  usuarioId
  ordenId
  creadoEn
  actualizadoEn
`;

const PAGO_FIELDS = `
  id
  monto
  metodo
  estado
  referencia
  ordenId
  creadoEn
  actualizadoEn
`;

interface UsuarioRecord {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

interface OrdenRecord {
  id: string;
  estado: string;
  usuarioId: string;
  total: number;
  creadoEn: string;
  actualizadoEn: string;
}

interface PedidoRecord {
  id: string;
  producto: string;
  descripcion: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  usuarioId: string;
  ordenId: string;
  creadoEn: string;
  actualizadoEn: string;
}

interface PagoRecord {
  id: string;
  monto: number;
  metodo: string;
  estado: string;
  referencia: string | null;
  ordenId: string;
  creadoEn: string;
  actualizadoEn: string;
}

async function obtenerUsuario(id: string): Promise<UsuarioRecord | null> {
  const data = await callService<{ usuario: UsuarioRecord | null }>(
    'usuarios',
    `query ($id: ID!) { usuario(id: $id) { ${USUARIO_FIELDS} } }`,
    { id },
  );
  return data.usuario ?? null;
}

async function obtenerOrden(id: string): Promise<OrdenRecord | null> {
  const data = await callService<{ orden: OrdenRecord | null }>(
    'ordenes',
    `query ($id: ID!) { orden(id: $id) { ${ORDEN_FIELDS} } }`,
    { id },
  );
  return data.orden ?? null;
}

async function obtenerPedidosPor(
  usuarioId?: string,
  ordenId?: string,
): Promise<PedidoRecord[]> {
  const data = await callService<{ pedidos: PedidoRecord[] }>(
    'pedidos',
    `query ($usuarioId: ID, $ordenId: ID) {
       pedidos(usuarioId: $usuarioId, ordenId: $ordenId) { ${PEDIDO_FIELDS} }
     }`,
    { usuarioId: usuarioId ?? null, ordenId: ordenId ?? null },
  );
  return data.pedidos ?? [];
}

async function obtenerPagosPor(ordenId?: string): Promise<PagoRecord[]> {
  const data = await callService<{ pagos: PagoRecord[] }>(
    'pagos',
    `query ($ordenId: ID) { pagos(ordenId: $ordenId) { ${PAGO_FIELDS} } }`,
    { ordenId: ordenId ?? null },
  );
  return data.pagos ?? [];
}

async function exigirUsuario(id: string): Promise<UsuarioRecord> {
  const usuario = await obtenerUsuario(id);
  if (!usuario) {
    throw new GraphQLError(`Usuario con id ${id} no existe.`);
  }
  return usuario;
}

async function exigirOrden(id: string): Promise<OrdenRecord> {
  const orden = await obtenerOrden(id);
  if (!orden) {
    throw new GraphQLError(`Orden con id ${id} no existe.`);
  }
  return orden;
}

function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export const resolvers = {
  DateTime: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
    parseLiteral: (ast: { value?: unknown }) => ast.value,
  },

  Query: {
    usuarios: async () => {
      const data = await callService<{ usuarios: UsuarioRecord[] }>(
        'usuarios',
        `query { usuarios { ${USUARIO_FIELDS} } }`,
      );
      return data.usuarios;
    },
    usuario: (_: unknown, args: { id: string }) =>
      exigirUsuario(args.id),
    ordenes: async () => {
      const data = await callService<{ ordenes: OrdenRecord[] }>(
        'ordenes',
        `query { ordenes { ${ORDEN_FIELDS} } }`,
      );
      return data.ordenes;
    },
    orden: (_: unknown, args: { id: string }) => exigirOrden(args.id),
    pedidos: (_: unknown, args: { usuarioId?: string; ordenId?: string }) =>
      obtenerPedidosPor(args.usuarioId, args.ordenId),
    pedido: async (_: unknown, args: { id: string }) => {
      const data = await callService<{ pedido: PedidoRecord | null }>(
        'pedidos',
        `query ($id: ID!) { pedido(id: $id) { ${PEDIDO_FIELDS} } }`,
        { id: args.id },
      );
      if (!data.pedido) {
        throw new GraphQLError(`Pedido con id ${args.id} no existe.`);
      }
      return data.pedido;
    },
    pagos: (_: unknown, args: { ordenId?: string }) =>
      obtenerPagosPor(args.ordenId),
    pago: async (_: unknown, args: { id: string }) => {
      const data = await callService<{ pago: PagoRecord | null }>(
        'pagos',
        `query ($id: ID!) { pago(id: $id) { ${PAGO_FIELDS} } }`,
        { id: args.id },
      );
      if (!data.pago) {
        throw new GraphQLError(`Pago con id ${args.id} no existe.`);
      }
      return data.pago;
    },
  },

  Mutation: {
    crearUsuario: async (_: unknown, args: { input: unknown }) => {
      const data = await callService<{ crearUsuario: UsuarioRecord }>(
        'usuarios',
        `mutation ($input: CrearUsuarioInput!) {
           crearUsuario(input: $input) { ${USUARIO_FIELDS} }
         }`,
        { input: args.input },
      );
      return data.crearUsuario;
    },
    actualizarUsuario: async (
      _: unknown,
      args: { id: string; input: unknown },
    ) => {
      const data = await callService<{ actualizarUsuario: UsuarioRecord }>(
        'usuarios',
        `mutation ($id: ID!, $input: ActualizarUsuarioInput!) {
           actualizarUsuario(id: $id, input: $input) { ${USUARIO_FIELDS} }
         }`,
        { id: args.id, input: args.input },
      );
      return data.actualizarUsuario;
    },
    eliminarUsuario: async (_: unknown, args: { id: string }) => {
      await exigirUsuario(args.id);
      const [ordenes, pedidos] = await Promise.all([
        callService<{ ordenes: OrdenRecord[] }>(
          'ordenes',
          `query { ordenes { ${ORDEN_FIELDS} } }`,
        ),
        obtenerPedidosPor(args.id, undefined),
      ]);
      const tieneOrdenes = ordenes.ordenes.some(
        (orden) => orden.usuarioId === args.id,
      );
      if (tieneOrdenes || pedidos.length > 0) {
        throw new GraphQLError(
          'No se puede eliminar un usuario con órdenes o pedidos asociados.',
        );
      }
      const data = await callService<{ eliminarUsuario: boolean }>(
        'usuarios',
        `mutation ($id: ID!) { eliminarUsuario(id: $id) }`,
        { id: args.id },
      );
      return data.eliminarUsuario;
    },

    crearOrden: async (
      _: unknown,
      args: { input: { usuarioId: string; estado?: string } },
    ) => {
      await exigirUsuario(args.input.usuarioId);
      const data = await callService<{ crearOrden: OrdenRecord }>(
        'ordenes',
        `mutation ($input: CrearOrdenInput!) {
           crearOrden(input: $input) { ${ORDEN_FIELDS} }
         }`,
        { input: args.input },
      );
      return data.crearOrden;
    },
    actualizarOrden: async (
      _: unknown,
      args: { id: string; input: unknown },
    ) => {
      await exigirOrden(args.id);
      const data = await callService<{ actualizarOrden: OrdenRecord }>(
        'ordenes',
        `mutation ($id: ID!, $input: ActualizarOrdenInput!) {
           actualizarOrden(id: $id, input: $input) { ${ORDEN_FIELDS} }
         }`,
        { id: args.id, input: args.input },
      );
      return data.actualizarOrden;
    },
    eliminarOrden: async (_: unknown, args: { id: string }) => {
      await exigirOrden(args.id);
      const [pedidos, pagos] = await Promise.all([
        obtenerPedidosPor(undefined, args.id),
        obtenerPagosPor(args.id),
      ]);
      if (pedidos.length > 0) {
        throw new GraphQLError(
          'No se puede eliminar una orden con pedidos asociados.',
        );
      }
      if (pagos.length > 0) {
        throw new GraphQLError(
          'No se puede eliminar una orden con pagos asociados.',
        );
      }
      const data = await callService<{ eliminarOrden: boolean }>(
        'ordenes',
        `mutation ($id: ID!) { eliminarOrden(id: $id) }`,
        { id: args.id },
      );
      return data.eliminarOrden;
    },

    crearPedido: async (
      _: unknown,
      args: {
        input: {
          producto: string;
          cantidad: number;
          precioUnitario: number;
          usuarioId: string;
          ordenId: string;
        };
      },
    ) => {
      await exigirUsuario(args.input.usuarioId);
      const orden = await exigirOrden(args.input.ordenId);
      if (orden.usuarioId !== args.input.usuarioId) {
        throw new GraphQLError(
          'El usuario del pedido debe ser el propietario de la orden.',
        );
      }
      const data = await callService<{ crearPedido: PedidoRecord }>(
        'pedidos',
        `mutation ($input: CrearPedidoInput!) {
           crearPedido(input: $input) { ${PEDIDO_FIELDS} }
         }`,
        { input: args.input },
      );
      return data.crearPedido;
    },
    actualizarPedido: async (
      _: unknown,
      args: {
        id: string;
        input: {
          cantidad?: number;
          precioUnitario?: number;
          usuarioId?: string;
          ordenId?: string;
        };
      },
    ) => {
      const actualRes = await callService<{ pedido: PedidoRecord | null }>(
        'pedidos',
        `query ($id: ID!) { pedido(id: $id) { ${PEDIDO_FIELDS} } }`,
        { id: args.id },
      );
      if (!actualRes.pedido) {
        throw new GraphQLError(`Pedido con id ${args.id} no existe.`);
      }
      const actual = actualRes.pedido;
      const usuarioId = args.input.usuarioId ?? actual.usuarioId;
      const ordenId = args.input.ordenId ?? actual.ordenId;
      await exigirUsuario(usuarioId);
      const orden = await exigirOrden(ordenId);
      if (orden.usuarioId !== usuarioId) {
        throw new GraphQLError(
          'El usuario del pedido debe ser el propietario de la orden.',
        );
      }
      const data = await callService<{ actualizarPedido: PedidoRecord }>(
        'pedidos',
        `mutation ($id: ID!, $input: ActualizarPedidoInput!) {
           actualizarPedido(id: $id, input: $input) { ${PEDIDO_FIELDS} }
         }`,
        { id: args.id, input: args.input },
      );
      return data.actualizarPedido;
    },
    eliminarPedido: async (_: unknown, args: { id: string }) => {
      const data = await callService<{ eliminarPedido: boolean }>(
        'pedidos',
        `mutation ($id: ID!) { eliminarPedido(id: $id) }`,
        { id: args.id },
      );
      return data.eliminarPedido;
    },

    crearPago: async (
      _: unknown,
      args: { input: { ordenId: string } },
    ) => {
      await exigirOrden(args.input.ordenId);
      const data = await callService<{ crearPago: PagoRecord }>(
        'pagos',
        `mutation ($input: CrearPagoInput!) {
           crearPago(input: $input) { ${PAGO_FIELDS} }
         }`,
        { input: args.input },
      );
      return data.crearPago;
    },
    actualizarPago: async (
      _: unknown,
      args: { id: string; input: { ordenId?: string } },
    ) => {
      const actualRes = await callService<{ pago: PagoRecord | null }>(
        'pagos',
        `query ($id: ID!) { pago(id: $id) { ${PAGO_FIELDS} } }`,
        { id: args.id },
      );
      if (!actualRes.pago) {
        throw new GraphQLError(`Pago con id ${args.id} no existe.`);
      }
      const ordenId = args.input.ordenId ?? actualRes.pago.ordenId;
      await exigirOrden(ordenId);
      const data = await callService<{ actualizarPago: PagoRecord }>(
        'pagos',
        `mutation ($id: ID!, $input: ActualizarPagoInput!) {
           actualizarPago(id: $id, input: $input) { ${PAGO_FIELDS} }
         }`,
        { id: args.id, input: args.input },
      );
      return data.actualizarPago;
    },
    eliminarPago: async (_: unknown, args: { id: string }) => {
      const data = await callService<{ eliminarPago: boolean }>(
        'pagos',
        `mutation ($id: ID!) { eliminarPago(id: $id) }`,
        { id: args.id },
      );
      return data.eliminarPago;
    },
  },

  Usuario: {
    pedidos: (parent: UsuarioRecord) => obtenerPedidosPor(parent.id, undefined),
    ordenes: async (parent: UsuarioRecord) => {
      const data = await callService<{ ordenes: OrdenRecord[] }>(
        'ordenes',
        `query { ordenes { ${ORDEN_FIELDS} } }`,
      );
      return data.ordenes.filter((orden) => orden.usuarioId === parent.id);
    },
  },

  Orden: {
    usuario: (parent: OrdenRecord) => exigirUsuario(parent.usuarioId),
    pedidos: (parent: OrdenRecord) => obtenerPedidosPor(undefined, parent.id),
    pagos: (parent: OrdenRecord) => obtenerPagosPor(parent.id),
    total: async (parent: OrdenRecord) => {
      const pedidos = await obtenerPedidosPor(undefined, parent.id);
      const total = pedidos.reduce((suma, pedido) => suma + pedido.subtotal, 0);
      return redondear(total);
    },
  },

  Pedido: {
    usuario: (parent: PedidoRecord) => exigirUsuario(parent.usuarioId),
    orden: (parent: PedidoRecord) => exigirOrden(parent.ordenId),
  },

  Pago: {
    orden: (parent: PagoRecord) => exigirOrden(parent.ordenId),
  },
};
