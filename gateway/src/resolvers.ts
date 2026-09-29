const SERVICES: Record<string, string> = {
  usuarios: 'http://usuarios-service:3001/graphql',
  ordenes: 'http://ordenes-service:3002/graphql',
  pedidos: 'http://pedidos-service:3003/graphql',
  pagos: 'http://pagos-service:3004/graphql',
};

async function proxy(service: string, query: string, variables?: Record<string, unknown>): Promise<any> {
  const res = await fetch(SERVICES[service], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export const resolvers = {
  Query: {
    usuarios: async () => (await proxy('usuarios', '{ usuarios { id nombre email telefono activo creadoEn actualizadoEn } }')).usuarios,
    usuario: async (_: unknown, { id }: { id: string }) =>
      (await proxy('usuarios', 'query($id: ID!) { usuario(id: $id) { id nombre email telefono activo creadoEn actualizadoEn } }', { id })).usuario,
    ordenes: async () => (await proxy('ordenes', '{ ordenes { id estado usuarioId total creadoEn actualizadoEn } }')).ordenes,
    orden: async (_: unknown, { id }: { id: string }) =>
      (await proxy('ordenes', 'query($id: ID!) { orden(id: $id) { id estado usuarioId total creadoEn actualizadoEn } }', { id })).orden,
    pedidos: async (_: unknown, { usuarioId, ordenId }: { usuarioId?: string; ordenId?: string }) =>
      (await proxy('pedidos', 'query($usuarioId: String, $ordenId: String) { pedidos(usuarioId: $usuarioId, ordenId: $ordenId) { id producto descripcion cantidad precioUnitario subtotal usuarioId ordenId creadoEn actualizadoEn } }', { usuarioId, ordenId })).pedidos,
    pedido: async (_: unknown, { id }: { id: string }) =>
      (await proxy('pedidos', 'query($id: ID!) { pedido(id: $id) { id producto descripcion cantidad precioUnitario subtotal usuarioId ordenId creadoEn actualizadoEn } }', { id })).pedido,
    pagos: async (_: unknown, { ordenId }: { ordenId?: string }) =>
      (await proxy('pagos', 'query($ordenId: String) { pagos(ordenId: $ordenId) { id monto metodo estado referencia ordenId creadoEn actualizadoEn } }', { ordenId: ordenId ?? null })).pagos,
    pago: async (_: unknown, { id }: { id: string }) =>
      (await proxy('pagos', 'query($id: ID!) { pago(id: $id) { id monto metodo estado referencia ordenId creadoEn actualizadoEn } }', { id })).pago,
  },
  Mutation: {
    crearUsuario: async (_: unknown, args: { nombre: string; email: string; telefono?: string }) =>
      (await proxy('usuarios', 'mutation($nombre: String!, $email: String!, $telefono: String) { crearUsuario(nombre: $nombre, email: $email, telefono: $telefono) { id nombre email telefono activo creadoEn actualizadoEn } }', args)).crearUsuario,
    actualizarUsuario: async (_: unknown, args: { id: string; nombre?: string; email?: string; telefono?: string; activo?: boolean }) =>
      (await proxy('usuarios', 'mutation($id: ID!, $nombre: String, $email: String, $telefono: String, $activo: Boolean) { actualizarUsuario(id: $id, nombre: $nombre, email: $email, telefono: $telefono, activo: $activo) { id nombre email telefono activo actualizadoEn } }', args)).actualizarUsuario,
    eliminarUsuario: async (_: unknown, { id }: { id: string }) =>
      (await proxy('usuarios', 'mutation($id: ID!) { eliminarUsuario(id: $id) }', { id })).eliminarUsuario,
    crearOrden: async (_: unknown, { usuarioId }: { usuarioId: string }) =>
      (await proxy('ordenes', 'mutation($usuarioId: ID!) { crearOrden(usuarioId: $usuarioId) { id estado usuarioId total creadoEn actualizadoEn } }', { usuarioId })).crearOrden,
    actualizarOrden: async (_: unknown, args: { id: string; estado?: string }) =>
      (await proxy('ordenes', 'mutation($id: ID!, $estado: String) { actualizarOrden(id: $id, estado: $estado) { id estado total actualizadoEn } }', args)).actualizarOrden,
    eliminarOrden: async (_: unknown, { id }: { id: string }) =>
      (await proxy('ordenes', 'mutation($id: ID!) { eliminarOrden(id: $id) }', { id })).eliminarOrden,
    crearPedido: async (_: unknown, { input }: { input: unknown }) =>
      (await proxy('pedidos', 'mutation($input: CrearPedidoInput!) { crearPedido(input: $input) { id producto descripcion cantidad precioUnitario subtotal usuarioId ordenId creadoEn actualizadoEn } }', { input })).crearPedido,
    actualizarPedido: async (_: unknown, args: { id: string; input: unknown }) =>
      (await proxy('pedidos', 'mutation($id: ID!, $input: ActualizarPedidoInput!) { actualizarPedido(id: $id, input: $input) { id producto descripcion cantidad precioUnitario subtotal usuarioId ordenId actualizadoEn } }', args)).actualizarPedido,
    eliminarPedido: async (_: unknown, { id }: { id: string }) =>
      (await proxy('pedidos', 'mutation($id: ID!) { eliminarPedido(id: $id) }', { id })).eliminarPedido,
    crearPago: async (_: unknown, { input }: { input: unknown }) =>
      (await proxy('pagos', 'mutation($input: CrearPagoInput!) { crearPago(input: $input) { pago { id monto metodo estado referencia ordenId creadoEn actualizadoEn } } }', { input })).crearPago.pago,
    actualizarPago: async (_: unknown, args: { id: string; input: unknown }) =>
      (await proxy('pagos', 'mutation($id: ID!, $input: ActualizarPagoInput!) { actualizarPago(id: $id, input: $input) { pago { id monto metodo estado referencia ordenId actualizadoEn } } }', args)).actualizarPago.pago,
    eliminarPago: async (_: unknown, { id }: { id: string }) =>
      (await proxy('pagos', 'mutation($id: ID!) { eliminarPago(id: $id) }', { id })).eliminarPago,
  },
};
