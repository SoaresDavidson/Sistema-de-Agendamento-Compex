import uuid
from collections.abc import Sequence
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.cliente import Client
from app.models.especialidade import Especialidade
from app.models.horario import Horario
from app.models.medico import Medico
from app.models.medico_especialidade import tabela_medico_especialidade
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
    cliente: str | None = None,
    medico: str | None = None,
    especialidade: str | None = None,
    status: StatusAgendamento | None = None,
    data: date | None = None,
) -> tuple[Sequence[Agendamento], int]:
    """Retorna agendamentos paginados ordenados por data/horário crescente e o total.

    Suporta filtros por nome do cliente (parcial, sem diferenciar maiúsculas),
    nome exato do médico, nome exato da especialidade, status e dia do horário.
    """
    offset = (page - 1) * size

    joins = []
    filtros = []

    if cliente:
        joins.append((Client, Agendamento.cliente_id == Client.id))
        filtros.append(Client.nome.ilike(f"%{cliente}%"))
    if medico or especialidade:
        joins.append((Medico, Horario.medico_id == Medico.id))
        if medico:
            filtros.append(Medico.nome == medico)
    if especialidade:
        joins.append(
            (tabela_medico_especialidade, tabela_medico_especialidade.c.medico_id == Medico.id)
        )
        joins.append(
            (Especialidade, Especialidade.id == tabela_medico_especialidade.c.especialidade_id)
        )
        filtros.append(Especialidade.nome == especialidade)
    if status is not None:
        filtros.append(Agendamento.status == status)
    if data is not None:
        inicio_dia = datetime.combine(data, time.min, tzinfo=UTC)
        fim_dia = inicio_dia + timedelta(days=1)
        filtros.append(Horario.inicio >= inicio_dia)
        filtros.append(Horario.inicio < fim_dia)

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
    for alvo, condicao in joins:
        stmt = stmt.join(alvo, condicao)
    if filtros:
        stmt = stmt.where(*filtros)
    agendamentos = session.scalars(stmt).all()

    total_stmt = select(func.count()).select_from(Agendamento).join(Horario, Agendamento.horario_id == Horario.id)
    for alvo, condicao in joins:
        total_stmt = total_stmt.join(alvo, condicao)
    if filtros:
        total_stmt = total_stmt.where(*filtros)
    total = session.scalar(total_stmt) or 0

    return agendamentos, total
