export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum EstadoOrden {
    PENDIENTE
    PAGADA
    COMPLETADA
    CANCELADA
  }

  enum EstadoPago {
    PENDIENTE
    APROBADO
    RECHAZADO
    REEMBOLSADO
  }

  enum MetodoPago {
    TARJETA
    EFECTIVO
    TRANSFERENCIA
    OTRO
  }

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    telefono: String
    activo: Boolean!
    pedidos: [Pedido!]!
    ordenes: [Orden!]!
    creadoEn: DateTime!
    actualizadoEn: DateTime!
  }

  type Orden {
    id: ID!
    estado: EstadoOrden!
    usuarioId: ID!
    usuario: Usuario!
    total: Float!
    pedidos: [Pedido!]!
    pagos: [Pago!]!
    creadoEn: DateTime!
    actualizadoEn: DateTime!
  }

  type Pedido {
    id: ID!
    producto: String!
    descripcion: String
    cantidad: Int!
    precioUnitario: Float!
    subtotal: Float!
    usuarioId: ID!
    usuario: Usuario!
    ordenId: ID!
    orden: Orden!
    creadoEn: DateTime!
    actualizadoEn: DateTime!
  }

  type Pago {
    id: ID!
    monto: Float!
    metodo: MetodoPago!
    estado: EstadoPago!
    referencia: String
    ordenId: ID!
    orden: Orden!
    creadoEn: DateTime!
    actualizadoEn: DateTime!
  }

  input CrearUsuarioInput {
    nombre: String!
    email: String!
    telefono: String
  }

  input ActualizarUsuarioInput {
    nombre: String
    email: String
    telefono: String
    activo: Boolean
  }

  input CrearOrdenInput {
    usuarioId: ID!
    estado: EstadoOrden
  }

  input ActualizarOrdenInput {
    estado: EstadoOrden
  }

  input CrearPedidoInput {
    producto: String!
    descripcion: String
    cantidad: Int!
    precioUnitario: Float!
    usuarioId: ID!
    ordenId: ID!
  }

  input ActualizarPedidoInput {
    producto: String
    descripcion: String
    cantidad: Int
    precioUnitario: Float
    usuarioId: ID
    ordenId: ID
  }

  input CrearPagoInput {
    monto: Float!
    metodo: MetodoPago!
    estado: EstadoPago
    referencia: String
    ordenId: ID!
  }

  input ActualizarPagoInput {
    monto: Float
    metodo: MetodoPago
    estado: EstadoPago
    referencia: String
    ordenId: ID
  }

  type Query {
    usuarios: [Usuario!]!
    usuario(id: ID!): Usuario
    ordenes: [Orden!]!
    orden(id: ID!): Orden
    pedidos(usuarioId: ID, ordenId: ID): [Pedido!]!
    pedido(id: ID!): Pedido
    pagos(ordenId: ID): [Pago!]!
    pago(id: ID!): Pago
  }

  type Mutation {
    crearUsuario(input: CrearUsuarioInput!): Usuario!
    actualizarUsuario(id: ID!, input: ActualizarUsuarioInput!): Usuario!
    eliminarUsuario(id: ID!): Boolean!

    crearOrden(input: CrearOrdenInput!): Orden!
    actualizarOrden(id: ID!, input: ActualizarOrdenInput!): Orden!
    eliminarOrden(id: ID!): Boolean!

    crearPedido(input: CrearPedidoInput!): Pedido!
    actualizarPedido(id: ID!, input: ActualizarPedidoInput!): Pedido!
    eliminarPedido(id: ID!): Boolean!

    crearPago(input: CrearPagoInput!): Pago!
    actualizarPago(id: ID!, input: ActualizarPagoInput!): Pago!
    eliminarPago(id: ID!): Boolean!
  }
`;
