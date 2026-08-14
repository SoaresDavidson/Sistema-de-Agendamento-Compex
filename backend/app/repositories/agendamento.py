import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.horario import Horario
from app.models.medico import Medico
from app.schemas.agendamento import AgendamentoCreate


def criar_agendamento(
    session: Session,
    dados: AgendamentoCreate,
) -> Agendamento:
    agendamento = Agendamento(
        **dados.model_dump(),
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    return agendamento


def buscar_agendamento_por_id(
    session: Session,
    agendamento_id: uuid.UUID,
) -> Agendamento | None:
    return session.get(Agendamento, agendamento_id)


def listar_agendamentos(
    session: Session,
    page: int,
    size: int,
) -> tuple[Sequence[Agendamento], int]:
    """Retorna agendamentos paginados ordenados por data/horário crescente e o total."""
    offset = (page - 1) * size

    stmt = (
        select(Agendamento)
        .options(
            selectinload(Agendamento.cliente),
            selectinload(Agendamento.horario).selectinload(Horario.medico).selectinload(Medico.especialidades),
        )
        .join(Horario, Agendamento.horario_id == Horario.id)
        .order_by(Horario.inicio.asc())
        .offset(offset)
        .limit(size)
    )
    agendamentos = session.scalars(stmt).all()

    total = session.scalar(
        select(func.count()).select_from(Agendamento)
    ) or 0

    return agendamentos, total
