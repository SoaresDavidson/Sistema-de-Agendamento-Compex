import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.horario import Horario
from app.schemas.horario import HorarioCreate


def criar_horario(session: Session, dados: HorarioCreate) -> Horario:
    horario = Horario(**dados.model_dump())
    session.add(horario)
    session.flush()
    return horario


def buscar_horario_por_id(
    session: Session,
    horario_id: uuid.UUID,
) -> Horario | None:
    return session.get(Horario, horario_id)


def listar_horarios(session: Session) -> Sequence[Horario]:
    statement = select(Horario).order_by(Horario.inicio, Horario.id)
    return session.scalars(statement).all()
