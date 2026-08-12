import uuid

from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
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
