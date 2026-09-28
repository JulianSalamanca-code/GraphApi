import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido, CrearPedidoInput, ActualizarPedidoInput } from './pedidos.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidosRepository: Repository<Pedido>,
  ) {}

  async obtenerTodos(usuarioId?: string, ordenId?: string): Promise<Pedido[]> {
    const where: any = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (ordenId) where.ordenId = ordenId;
    return this.pedidosRepository.find({ where });
  }

  async obtenerPorId(id: string): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({ where: { id } });
    if (!pedido) throw new Error(`Pedido no encontrado: ${id}`);
    return pedido;
  }

  async crear(input: CrearPedidoInput): Promise<Pedido> {
    const subtotal = input.cantidad * input.precioUnitario;
    const pedido = this.pedidosRepository.create({
      ...input,
      id: uuidv4(),
      subtotal,
    });
    return this.pedidosRepository.save(pedido);
  }

  async actualizar(id: string, input: ActualizarPedidoInput): Promise<Pedido> {
    const pedido = await this.obtenerPorId(id);
    Object.assign(pedido, input);
    if (input.cantidad !== undefined || input.precioUnitario !== undefined) {
      pedido.subtotal = pedido.cantidad * pedido.precioUnitario;
    }
    return this.pedidosRepository.save(pedido);
  }

  async eliminar(id: string): Promise<boolean> {
    const result = await this.pedidosRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
