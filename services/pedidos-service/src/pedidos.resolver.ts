import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PedidosService } from './pedidos.service';
import { Pedido, CrearPedidoInput, ActualizarPedidoInput } from './pedidos.model';

@Resolver(() => Pedido)
export class PedidosResolver {
  constructor(private pedidosService: PedidosService) {}

  @Query(() => [Pedido])
  async pedidos(
    @Args('usuarioId', { type: () => ID, nullable: true }) usuarioId?: string,
    @Args('ordenId', { type: () => ID, nullable: true }) ordenId?: string,
  ) {
    return this.pedidosService.obtenerTodos(usuarioId, ordenId);
  }

  @Query(() => Pedido)
  async pedido(@Args('id', { type: () => ID }) id: string) {
    return this.pedidosService.obtenerPorId(id);
  }

  @Mutation(() => Pedido)
  async crearPedido(@Args('input') input: CrearPedidoInput) {
    return this.pedidosService.crear(input);
  }

  @Mutation(() => Pedido)
  async actualizarPedido(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ActualizarPedidoInput,
  ) {
    return this.pedidosService.actualizar(id, input);
  }

  @Mutation(() => Boolean)
  async eliminarPedido(@Args('id', { type: () => ID }) id: string) {
    return this.pedidosService.eliminar(id);
  }
}
