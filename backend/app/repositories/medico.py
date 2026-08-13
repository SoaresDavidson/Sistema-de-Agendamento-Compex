import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.models.medico import Medico
from app.schemas.medico import MedicoCreate

_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


def criar_medico(session: Session, payload: MedicoCreate) -> Medico | None:
    especialidades = list(
        session.scalars(
            select(Especialidade).where(
                Especialidade.id.in_(payload.especialidades_id)
            )
        ).all()
    )

    if len(especialidades) != len(set(payload.especialidades_id)):
        return None

    medico = Medico(nome=payload.nome, especialidades=especialidades)
    session.add(medico)
    session.flush()
    return medico


def listar_medico(
    session: Session,
    cursor_id: uuid.UUID | None = None,
    limit: int = _DEFAULT_LIMIT,
    nome: str | None = None,
    especialidade_id: uuid.UUID | None = None,
) -> tuple[Sequence[Medico], uuid.UUID | None]:
    limit = max(1, min(limit, _MAX_LIMIT))
    statement = select(Medico).order_by(Medico.id)

    if nome:
        statement = statement.where(Medico.nome.ilike(f"%{nome.strip()}%"))

    if especialidade_id is not None:
        statement = (
            statement.join(Medico.especialidades)
            .where(Especialidade.id == especialidade_id)
        )

    if cursor_id is not None:
        statement = statement.where(Medico.id > cursor_id)

    medicos = list(session.scalars(statement.limit(limit + 1)).all())

    possui_proxima_pagina = len(medicos) > limit
    medicos = medicos[:limit]

    proximo_id = medicos[-1].id if possui_proxima_pagina else None

    return medicos, proximo_id
