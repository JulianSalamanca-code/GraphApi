import graphene
from graphene.types.datetime import DateTime

from app.models import Pago


class MetodoPago(graphene.Enum):
    TARJETA = 'TARJETA'
    EFECTIVO = 'EFECTIVO'
    TRANSFERENCIA = 'TRANSFERENCIA'
    OTRO = 'OTRO'


class EstadoPago(graphene.Enum):
    PENDIENTE = 'PENDIENTE'
    APROBADO = 'APROBADO'
    RECHAZADO = 'RECHAZADO'
    REEMBOLSADO = 'REEMBOLSADO'


class PagoType(graphene.ObjectType):
    id = graphene.ID(required=True)
    monto = graphene.Float(required=True)
    metodo = graphene.Field(MetodoPago, required=True)
    estado = graphene.Field(EstadoPago, required=True)
    referencia = graphene.String()
    ordenId = graphene.ID(required=True)
    creadoEn = graphene.Field(DateTime, required=True)
    actualizadoEn = graphene.Field(DateTime, required=True)

    def resolve_ordenId(root, info):
        return root.orden_id

    def resolve_creadoEn(root, info):
        return root.creado_en

    def resolve_actualizadoEn(root, info):
        return root.actualizado_en


class CrearPagoInput(graphene.InputObjectType):
    monto = graphene.Float(required=True)
    metodo = MetodoPago(required=True)
    estado = EstadoPago()
    referencia = graphene.String()
    ordenId = graphene.ID(required=True)


class ActualizarPagoInput(graphene.InputObjectType):
    monto = graphene.Float()
    metodo = MetodoPago()
    estado = EstadoPago()
    referencia = graphene.String()
    ordenId = graphene.ID()


def _texto_opcional(valor):
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto if texto else None


class Query(graphene.ObjectType):
    pagos = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(PagoType))),
        ordenId=graphene.ID(),
    )
    pago = graphene.Field(PagoType, id=graphene.ID(required=True))

    def resolve_pagos(root, info, ordenId=None):
        query = Pago.query
        if ordenId:
            query = query.filter(Pago.orden_id == ordenId)
        return query.all()

    def resolve_pago(root, info, id):
        return Pago.query.get(id)


class Mutation(graphene.ObjectType):
    crearPago = graphene.Field(
        graphene.NonNull(PagoType),
        input=graphene.Argument(CrearPagoInput, required=True),
    )
    actualizarPago = graphene.Field(
        graphene.NonNull(PagoType),
        id=graphene.Argument(graphene.ID, required=True),
        input=graphene.Argument(ActualizarPagoInput, required=True),
    )
    eliminarPago = graphene.Field(
        graphene.NonNull(graphene.Boolean),
        id=graphene.Argument(graphene.ID, required=True),
    )

    def resolve_crearPago(root, info, input):
        monto = input.monto
        if monto is None or monto <= 0:
            raise ValueError('Bad Request: el monto debe ser mayor que 0.')

        metodo = input.metodo
        metodo_valor = metodo.value if hasattr(metodo, 'value') else metodo
        estado = getattr(input, 'estado', None)
        estado_valor = estado.value if hasattr(estado, 'value') else (estado or 'PENDIENTE')

        pago = Pago(
            monto=monto,
            metodo=metodo_valor,
            estado=estado_valor or 'PENDIENTE',
            referencia=_texto_opcional(input.referencia),
            orden_id=input.ordenId,
        )
        from app import db
        db.session.add(pago)
        db.session.commit()
        return pago

    def resolve_actualizarPago(root, info, id, input):
        pago = Pago.query.get(id)
        if not pago:
            raise ValueError(f'Pago con id {id} no existe.')

        if input.monto is not None:
            if input.monto <= 0:
                raise ValueError('Bad Request: el monto debe ser mayor que 0.')
            pago.monto = input.monto
        if input.metodo is not None:
            pago.metodo = input.metodo.value if hasattr(input.metodo, 'value') else input.metodo
        if input.estado is not None:
            pago.estado = input.estado.value if hasattr(input.estado, 'value') else input.estado
        if input.referencia is not None:
            pago.referencia = _texto_opcional(input.referencia)
        if input.ordenId is not None:
            pago.orden_id = input.ordenId

        from app import db
        db.session.commit()
        return pago

    def resolve_eliminarPago(root, info, id):
        pago = Pago.query.get(id)
        if not pago:
            return False
        from app import db
        db.session.delete(pago)
        db.session.commit()
        return True


schema = graphene.Schema(query=Query, mutation=Mutation)
