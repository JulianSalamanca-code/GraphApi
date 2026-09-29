import strawberry
from strawberry.federation import Schema
from strawberry.types import Info
from app.models import Pago


@strawberry.type
class PagoType:
    id: str
    monto: float
    metodo: str
    estado: str
    referencia: str | None
    ordenId: str
    creadoEn: str
    actualizadoEn: str


@strawberry.type
class Query:
    @strawberry.field
    def pagos(self, info: Info, ordenId: str | None = None) -> list[PagoType]:
        query = Pago.query
        if ordenId:
            query = query.filter(Pago.orden_id == ordenId)
        return [
            PagoType(
                id=p.id,
                monto=p.monto,
                metodo=p.metodo,
                estado=p.estado,
                referencia=p.referencia,
                ordenId=p.orden_id,
                creadoEn=p.creado_en.isoformat(),
                actualizadoEn=p.actualizado_en.isoformat(),
            )
            for p in query.all()
        ]

    @strawberry.field
    def pago(self, info: Info, id: str) -> PagoType | None:
        p = Pago.query.get(id)
        if not p:
            return None
        return PagoType(
            id=p.id,
            monto=p.monto,
            metodo=p.metodo,
            estado=p.estado,
            referencia=p.referencia,
            ordenId=p.orden_id,
            creadoEn=p.creado_en.isoformat(),
            actualizadoEn=p.actualizado_en.isoformat(),
        )


@strawberry.input
class CrearPagoInput:
    monto: float
    metodo: str
    referencia: str | None = None
    ordenId: str


@strawberry.type
class CrearPagoPayload:
    pago: PagoType


@strawberry.input
class ActualizarPagoInput:
    monto: float | None = None
    metodo: str | None = None
    estado: str | None = None
    referencia: str | None = None
    ordenId: str | None = None


@strawberry.type
class ActualizarPagoPayload:
    pago: PagoType


@strawberry.type
class EliminarPagoPayload:
    success: bool


@strawberry.type
class Mutation:
    @strawberry.mutation
    def crearPago(self, info: Info, input: CrearPagoInput) -> CrearPagoPayload:
        from app import db
        pago = Pago(
            monto=input.monto,
            metodo=input.metodo,
            estado='PENDIENTE',
            referencia=input.referencia,
            orden_id=input.ordenId,
        )
        db.session.add(pago)
        db.session.commit()
        return CrearPagoPayload(pago=PagoType(
            id=pago.id,
            monto=pago.monto,
            metodo=pago.metodo,
            estado=pago.estado,
            referencia=pago.referencia,
            ordenId=pago.orden_id,
            creadoEn=pago.creado_en.isoformat(),
            actualizadoEn=pago.actualizado_en.isoformat(),
        ))

    @strawberry.mutation
    def actualizarPago(self, info: Info, id: str, input: ActualizarPagoInput) -> ActualizarPagoPayload:
        from app import db
        pago = Pago.query.get(id)
        if not pago:
            raise Exception(f"Pago no encontrado: {id}")
        if input.monto is not None:
            pago.monto = input.monto
        if input.metodo is not None:
            pago.metodo = input.metodo
        if input.estado is not None:
            pago.estado = input.estado
        if input.referencia is not None:
            pago.referencia = input.referencia
        if input.ordenId is not None:
            pago.orden_id = input.ordenId
        db.session.commit()
        return ActualizarPagoPayload(pago=PagoType(
            id=pago.id,
            monto=pago.monto,
            metodo=pago.metodo,
            estado=pago.estado,
            referencia=pago.referencia,
            ordenId=pago.orden_id,
            creadoEn=pago.creado_en.isoformat(),
            actualizadoEn=pago.actualizado_en.isoformat(),
        ))

    @strawberry.mutation
    def eliminarPago(self, info: Info, id: str) -> EliminarPagoPayload:
        from app import db
        pago = Pago.query.get(id)
        if not pago:
            return EliminarPagoPayload(success=False)
        db.session.delete(pago)
        db.session.commit()
        return EliminarPagoPayload(success=True)


schema = Schema(query=Query, mutation=Mutation)
