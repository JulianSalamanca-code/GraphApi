import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido, CrearPedidoInput, ActualizarPedidoInput } from './pedidos.model';

function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function limpiarOpcional(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  const texto = valor.trim();
  return texto.length === 0 ? null : texto;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidosRepository: Repository<Pedido>,
  ) {}

  async obtenerTodos(usuarioId?: string, ordenId?: string): Promise<Pedido[]> {
    const where: Record<string, string> = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (ordenId) where.ordenId = ordenId;
    return this.pedidosRepository.find({ where });
  }

  async obtenerPorId(id: string): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no existe.`);
    }
    return pedido;
  }

  async crear(input: CrearPedidoInput): Promise<Pedido> {
    const producto = input.producto?.trim();
    if (!producto) {
      throw new BadRequestException('Bad Request: el producto es obligatorio.');
    }

    const pedido = this.pedidosRepository.create({
      producto,
      descripcion: limpiarOpcional(input.descripcion),
      cantidad: input.cantidad,
      precioUnitario: input.precioUnitario,
      subtotal: redondear(input.cantidad * input.precioUnitario),
      usuarioId: input.usuarioId,
      ordenId: input.ordenId,
    });
    return this.pedidosRepository.save(pedido);
  }

  async actualizar(id: string, input: ActualizarPedidoInput): Promise<Pedido> {
    const pedido = await this.obtenerPorId(id);

    if (input.producto !== undefined) {
      const producto = input.producto?.trim();
      if (!producto) {
        throw new BadRequestException('Bad Request: el producto es obligatorio.');
      }
      pedido.producto = producto;
    }
    if (input.descripcion !== undefined) {
      pedido.descripcion = limpiarOpcional(input.descripcion);
    }
    if (input.cantidad !== undefined) {
      pedido.cantidad = input.cantidad;
    }
    if (input.precioUnitario !== undefined) {
      pedido.precioUnitario = input.precioUnitario;
    }
    if (input.usuarioId !== undefined) {
      pedido.usuarioId = input.usuarioId;
    }
    if (input.ordenId !== undefined) {
      pedido.ordenId = input.ordenId;
    }

    pedido.subtotal = redondear(pedido.cantidad * pedido.precioUnitario);
    return this.pedidosRepository.save(pedido);
  }

  async eliminar(id: string): Promise<boolean> {
    const result = await this.pedidosRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
