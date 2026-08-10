import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.schemas.clientes import ClienteCreate

_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


def criar_cliente(session: Session, payload: ClienteCreate) -> Client:
    cliente = Client(**payload.model_dump())
    session.add(cliente)
    session.flush()
    return cliente


def buscar_cliente_por_id(session: Session, client_id: uuid.UUID) -> Client | None:
    return session.get(Client, client_id)


def buscar_possivel_duplicidade(
    session: Session,
    payload: ClienteCreate,
) -> Client | None:
    return session.scalar(
        select(Client)
        .where(
            Client.nome == payload.nome,
            Client.data_nascimento == payload.data_nascimento,
        )
        .limit(1)
    )


def listar_clientes(
    session: Session,
    cursor_id: uuid.UUID | None = None, 
    limit: int = _DEFAULT_LIMIT
) -> tuple[Sequence[Client], uuid.UUID]:
    statement = select(Client).order_by(Client.Client.id)

    if cursor_id is not None:
        statement = statement.where(Client.id > cursor_id)

    clientes = list(
        session.scalars(
            statement.limit(limit + 1)
        ).all()
    )

    possui_proxima_pagina = len(clientes) > limit
    clientes = clientes[:limit]

    proximo_id = (
        clientes[-1].id
        if possui_proxima_pagina
        else None
    )

    return clientes, proximo_id


def apagar_cliente(session: Session, payload: Client):
    # TODO implementar constraint de só apagar cliente com 0 agendamento quando existir tabela agendamento
    pass
