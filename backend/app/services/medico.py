import uuid

from sqlalchemy.orm import Session

from app.repositories.medico import criar_medico, listar_medico
from app.schemas.medico import MedicoCreate, MedicoPage


class MedicoSemEspecialidade(Exception):
    """Tentativa de cadastro de médico sem pelo menos uma especialidade."""

class MedicoSemNome(Exception):
    """Tentativa de cadastro de médico sem nome"""

def cadastrar_medico_service(session: Session, payload: MedicoCreate):
    if not payload.especialidades_id:
        raise MedicoSemEspecialidade


    return criar_medico(session, payload)

def listar_medicos_service(
    session: Session,
    cursor_id: uuid.UUID | None,
    limite: int,
    nome: str | None = None,
    especialidade_id: uuid.UUID | None = None,
) -> MedicoPage:
    medicos, proximo_id = listar_medico(
        session,
        cursor_id,
        limite,
        nome,
        especialidade_id,
    )
    return MedicoPage(
        items=list(medicos),
        next_cursor=str(proximo_id) if proximo_id is not None else None,
    )
