import uuid

from sqlalchemy.orm import Session

from app.repositories.especialidade import (
    buscar_especialidade_por_nome_normalizado,
    criar_especialidade,
    listar_especialidade,
)
from app.schemas.especialidade import (
    EspecialidadeCreate,
    EspecialidadePage,
    EspecialidadeResponse,
)


class EspecialidadeDuplicada(Exception):
    """Tentativa de cadastro de especialidade com nome já existente."""


def criar_especialidade_service(
    session: Session,
    payload: EspecialidadeCreate,
) -> EspecialidadeResponse:
    if buscar_especialidade_por_nome_normalizado(session, payload.nome) is not None:
        raise EspecialidadeDuplicada("Especialidade já cadastrada.")

    return criar_especialidade(session, payload)


def listar_especialidades_service(
    session: Session,
    cursor_id: uuid.UUID | None,
    limite: int,
) -> EspecialidadePage:
    especialidades, proximo_id = listar_especialidade(session, cursor_id, limite)
    return EspecialidadePage(
        items=list(especialidades),
        next_cursor=str(proximo_id) if proximo_id is not None else None,
    )
