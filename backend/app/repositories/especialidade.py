import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.schemas.especialidade import EspecialidadeCreate, EspecialidadeUpdate

_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


def criar_especialidade(
    session: Session,
    payload: EspecialidadeCreate,
) -> Especialidade:
    especialidade = Especialidade(nome=payload.nome)
    session.add(especialidade)
    session.flush()
    return especialidade


def buscar_especialidade_por_nome_normalizado(
    session: Session,
    nome: str,
    especialidade_id_excluido: uuid.UUID | None = None,
) -> Especialidade | None:
    nome_normalizado = func.lower(
        func.regexp_replace(func.btrim(Especialidade.nome), r"\s+", " ", "g")
    )
    statement = select(Especialidade).where(nome_normalizado == nome.lower())
    if especialidade_id_excluido is not None:
        statement = statement.where(Especialidade.id != especialidade_id_excluido)
    return session.scalar(statement.limit(1))


def buscar_especialidade_por_id(
    session: Session,
    especialidade_id: uuid.UUID,
) -> Especialidade | None:
    return session.get(Especialidade, especialidade_id)


def atualizar_especialidade(
    session: Session,
    especialidade: Especialidade,
    payload: EspecialidadeUpdate,
) -> Especialidade:
    especialidade.nome = payload.nome
    session.flush()
    return especialidade


def listar_especialidade(
    session: Session,
    cursor_id: uuid.UUID | None = None,
    limit: int = _DEFAULT_LIMIT,
) -> tuple[Sequence[Especialidade], uuid.UUID | None]:
    limit = max(1, min(limit, _MAX_LIMIT))
    statement = select(Especialidade).order_by(Especialidade.id)

    if cursor_id is not None:
        statement = statement.where(Especialidade.id > cursor_id)

    especialidades = list(session.scalars(statement.limit(limit + 1)).all())

    possui_proxima_pagina = len(especialidades) > limit
    especialidades = especialidades[:limit]

    proximo_id = especialidades[-1].id if possui_proxima_pagina else None

    return especialidades, proximo_id
