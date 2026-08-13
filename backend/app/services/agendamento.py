from datetime import datetime

from sqlalchemy.orm import Session
import uuid
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
from app.repositories.agendamento import criar_agendamento, buscar_agendamento_por_id
from app.repositories.clientes import buscar_cliente_por_id
from app.repositories.horario import buscar_horario_para_agendamento
from app.schemas.agendamento import AgendamentoCreate
from app.services.horario import horario_esta_disponivel

class ClienteNaoEncontradoError(LookupError):
    """Indica que o cliente informado não existe."""


class HorarioNaoEncontradoParaAgendamentoError(LookupError):
    """Indica que o horário informado não existe."""


class HorarioIndisponivelError(Exception):
    """Indica que o horário não pode receber um novo agendamento."""

class AgendamentoNaoEncontradoError(LookupError):
    """Indica que o agendamento informado não existe."""


class AgendamentoJaCanceladoError(Exception):
    """Indica que o agendamento já está cancelado."""


def realizar_agendamento(
    session: Session,
    dados: AgendamentoCreate,
    agora: datetime | None = None,
) -> Agendamento:
    cliente = buscar_cliente_por_id(session, dados.cliente_id)
    if cliente is None:
        raise ClienteNaoEncontradoError(dados.cliente_id)

    horario = buscar_horario_para_agendamento(session, dados.horario_id)
    if horario is None:
        raise HorarioNaoEncontradoParaAgendamentoError(dados.horario_id)

    if not horario_esta_disponivel(horario, agora):
        raise HorarioIndisponivelError(dados.horario_id)

    return criar_agendamento(session, dados)


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
