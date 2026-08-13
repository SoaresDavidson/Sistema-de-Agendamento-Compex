import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.horario import Horario
from app.models.medico import Medico
from app.schemas.horario import HorarioCreate, HorarioDisponivelFiltros


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


def buscar_horario_para_agendamento(
    session: Session,
    horario_id: uuid.UUID,
) -> Horario | None:
    statement = (
        select(Horario)
        .where(Horario.id == horario_id)
        .options(selectinload(Horario.agendamentos))
        .with_for_update()
    )
    return session.scalar(statement)


def listar_horarios(session: Session) -> Sequence[Horario]:
    statement = select(Horario).order_by(Horario.inicio, Horario.id)
    return session.scalars(statement).all()


def listar_horarios_filtrados(
    session: Session,
    filtros: HorarioDisponivelFiltros,
) -> Sequence[Horario]:
    statement = (
        select(Horario)
        .options(
            joinedload(Horario.medico).selectinload(Medico.especialidades),
            selectinload(Horario.agendamentos),
        )
        .order_by(Horario.inicio, Horario.id)
    )

    if filtros.data is not None:
        inicio_do_dia = datetime.combine(filtros.data, time.min, tzinfo=UTC)
        fim_do_dia = inicio_do_dia + timedelta(days=1)
        statement = statement.where(
            Horario.inicio >= inicio_do_dia,
            Horario.inicio < fim_do_dia,
        )

    if filtros.medico_id is not None:
        statement = statement.where(Horario.medico_id == filtros.medico_id)

    if filtros.especialidade_id is not None:
        statement = statement.where(
            Horario.medico.has(
                Medico.especialidades.any(id=filtros.especialidade_id)
            )
        )

    return session.scalars(statement).all()


def buscar_horarios_sobrepostos(
    session: Session,
    medico_id: uuid.UUID,
    inicio: datetime,
    fim: datetime,
) -> Sequence[Horario]:
    statement = (
        select(Horario)
        .where(
            Horario.medico_id == medico_id,
            Horario.inicio < fim,
            Horario.fim > inicio,
        )
        .order_by(Horario.inicio, Horario.id)
    )
    return session.scalars(statement).all()
