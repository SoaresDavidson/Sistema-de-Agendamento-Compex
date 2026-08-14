import uuid
from collections.abc import Sequence

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento
from app.models.cliente import Client
from app.schemas.clientes import ClienteCreate, ClienteUpdate

_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


def criar_cliente(session: Session, payload: ClienteCreate) -> Client:
    cliente = Client(**payload.model_dump(exclude={"confirmar_duplicidade"}))
    session.add(cliente)
    session.flush()
    return cliente


def buscar_cliente_por_id(session: Session, client_id: uuid.UUID) -> Client | None:
    return session.get(Client, client_id)


def cliente_possui_agendamentos(session: Session, cliente_id: uuid.UUID) -> bool:
    statement = select(exists().where(Agendamento.cliente_id == cliente_id))
    return session.scalar(statement) is True


def buscar_possivel_duplicidade(
    session: Session,
    payload: ClienteCreate | ClienteUpdate,
    cliente_id_excluido: uuid.UUID | None = None,
) -> Client | None:
    if payload.nome is None or payload.data_nascimento is None:
        return None

    statement = select(Client).where(
        func.lower(Client.nome) == payload.nome.lower(),
        Client.data_nascimento == payload.data_nascimento,
    )
    if cliente_id_excluido is not None:
        statement = statement.where(Client.id != cliente_id_excluido)

    return session.scalar(statement.limit(1))


def atualizar_cliente(
    session: Session,
    cliente: Client,
    payload: ClienteUpdate,
) -> Client:
    campos = payload.model_dump(
        exclude={"confirmar_duplicidade"},
        exclude_unset=True,
    )
    for campo, valor in campos.items():
        setattr(cliente, campo, valor)
    session.flush()
    return cliente


def listar_clientes(
    session: Session,
    cursor_id: uuid.UUID | None = None,
    limit: int = _DEFAULT_LIMIT,
) -> tuple[Sequence[Client], uuid.UUID | None]:
    limit = max(1, min(limit, _MAX_LIMIT))
    statement = select(Client).order_by(Client.id)

    if cursor_id is not None:
        statement = statement.where(Client.id > cursor_id)

    clientes = list(session.scalars(statement.limit(limit + 1)).all())

    possui_proxima_pagina = len(clientes) > limit
    clientes = clientes[:limit]

    proximo_id = clientes[-1].id if possui_proxima_pagina else None

    return clientes, proximo_id


def apagar_cliente(session: Session, cliente: Client) -> None:
    session.delete(cliente)
    session.flush()
