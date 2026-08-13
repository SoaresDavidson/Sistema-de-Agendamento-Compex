import uuid

from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
from app.repositories.agendamento import buscar_agendamento_por_id


class AgendamentoNaoEncontradoError(LookupError):
    """Indica que o agendamento informado não existe."""


class AgendamentoJaCanceladoError(Exception):
    """Indica que o agendamento já está cancelado."""


def validar_cancelamento(
    session: Session,
    agendamento_id: uuid.UUID,
) -> Agendamento:
    agendamento = buscar_agendamento_por_id(session, agendamento_id)
    if agendamento is None:
        raise AgendamentoNaoEncontradoError(agendamento_id)
    if agendamento.status is not StatusAgendamento.AGENDADO:
        raise AgendamentoJaCanceladoError(agendamento_id)
    return agendamento
