import math
import uuid
from datetime import UTC, date, datetime

from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, CancelamentoOrigem, StatusAgendamento
from app.repositories.agendamento import (
    buscar_agendamento_por_id,
    criar_agendamento,
    listar_agendamentos,
)
from app.repositories.clientes import buscar_cliente_por_id
from app.repositories.horario import buscar_horario_para_agendamento
from app.schemas.agendamento import (
    AgendamentoCreate,
    AgendamentoListagemResponse,
    AgendamentoPage,
    StatusAgendamentoExibicao,
)
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


def aplicar_cancelamento(
    session: Session,
    agendamento: Agendamento,
    origem: CancelamentoOrigem,
    observacao: str | None,
) -> Agendamento:
    agendamento.status = StatusAgendamento.CANCELADO
    agendamento.cancelado_por = origem
    agendamento.cancelado_em = datetime.now(UTC)
    observacao_limpa = observacao.strip() if observacao else None
    agendamento.observacao_cancelamento = observacao_limpa or None
    if origem is CancelamentoOrigem.MEDICO:
        agendamento.horario.ativo = False
    session.flush()
    return agendamento


def listar_agendamentos_service(
    session: Session,
    page: int,
    size: int,
    cliente: str | None = None,
    medico: str | None = None,
    especialidade: str | None = None,
    status: str | None = None,
    data: date | None = None,
    agora: datetime | None = None,
) -> AgendamentoPage:
    if agora is None:
        agora = datetime.now(UTC)

    status_exibicao: StatusAgendamentoExibicao | None = None
    if status is not None:
        try:
            status_exibicao = StatusAgendamentoExibicao(status)
        except ValueError:
            return AgendamentoPage(
                items=[],
                page=1,
                size=size,
                total=0,
                totalPages=1,
            )

    agendamentos, total = listar_agendamentos(
        session,
        page,
        size,
        cliente=cliente,
        medico=medico,
        especialidade=especialidade,
        status=status_exibicao,
        data=data,
        agora=agora,
    )

    total_pages = max(1, math.ceil(total / size))
    safe_page = max(1, min(page, total_pages))

    items: list[AgendamentoListagemResponse] = []
    for a in agendamentos:
        especialidade = a.horario.medico.especialidades[0].nome if a.horario.medico.especialidades else ""
        if a.status is StatusAgendamento.AGENDADO and a.horario.fim < agora:
            status_exibido = StatusAgendamentoExibicao.CONCLUIDO
        else:
            status_exibido = StatusAgendamentoExibicao(a.status.value)
        items.append(
            AgendamentoListagemResponse(
                id=a.id,
                cliente=a.cliente.nome,
                medico=a.horario.medico.nome,
                especialidade=especialidade,
                data=a.horario.inicio.strftime("%d/%m/%Y"),
                horario=f"{a.horario.inicio.strftime('%H:%M')}–{a.horario.fim.strftime('%H:%M')}",
                status=status_exibido,
            )
        )

    return AgendamentoPage(
        items=items,
        page=safe_page,
        size=size,
        total=total,
        totalPages=total_pages,
    )
