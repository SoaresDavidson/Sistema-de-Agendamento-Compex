import uuid
from collections.abc import Sequence
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.agendamento import StatusAgendamento
from app.models.horario import Horario
from app.repositories.horario import (
    buscar_horario_por_id,
    buscar_horarios_sobrepostos,
    criar_horario,
    listar_horarios_filtrados,
)
from app.schemas.horario import (
    DiaSemana,
    HorarioCreate,
    HorarioDisponivelFiltros,
    HorarioLoteCreate,
)


class IntervaloHorarioInvalidoError(ValueError):
    """Indica que o início não é anterior ao fim."""


class HorarioNoPassadoError(ValueError):
    """Indica tentativa de cadastrar um horário que já começou."""


class HorarioConflitanteError(Exception):
    def __init__(self, conflitos: Sequence[Horario]) -> None:
        self.conflitos = tuple(conflitos)
        super().__init__("Existem horários sobrepostos para este médico")


class HorariosLoteConflitantesError(Exception):
    """Indica conflitos com horários persistidos ou entre blocos do lote."""

    def __init__(
        self,
        conflitos_existentes: Sequence[Horario],
        conflitos_no_lote: Sequence[HorarioCreate],
    ) -> None:
        self.conflitos_existentes = tuple(conflitos_existentes)
        self.conflitos_no_lote = tuple(conflitos_no_lote)
        super().__init__("Existem conflitos nos horários gerados para o lote")


class HorarioNaoEncontradoError(LookupError):
    """Indica que o horário informado não existe."""


class HorarioJaInativoError(Exception):
    """Indica que o horário já está inativo."""


def horario_esta_disponivel(
    horario: Horario,
    agora: datetime | None = None,
) -> bool:
    referencia = agora or datetime.now(UTC)
    possui_agendamento_ativo = any(
        agendamento.status == StatusAgendamento.AGENDADO
        for agendamento in horario.agendamentos
    )

    return horario.ativo and horario.inicio > referencia and not possui_agendamento_ativo


def consultar_horarios_disponiveis(
    session: Session,
    filtros: HorarioDisponivelFiltros,
    agora: datetime | None = None,
) -> list[Horario]:
    referencia = agora or datetime.now(UTC)
    horarios = listar_horarios_filtrados(session, filtros)
    return [
        horario
        for horario in horarios
        if horario_esta_disponivel(horario, referencia)
    ]


def cadastrar_horario_individual(
    session: Session,
    dados: HorarioCreate,
    agora: datetime | None = None,
) -> Horario:
    if dados.inicio >= dados.fim:
        raise IntervaloHorarioInvalidoError("inicio deve ser anterior a fim")

    referencia = agora or datetime.now(dados.inicio.tzinfo)
    if dados.inicio <= referencia:
        raise HorarioNoPassadoError("não é permitido cadastrar horário no passado")

    conflitos = buscar_horarios_sobrepostos(
        session,
        dados.medico_id,
        dados.inicio,
        dados.fim,
    )
    if conflitos:
        raise HorarioConflitanteError(conflitos)

    return criar_horario(session, dados)


def cadastrar_horarios_em_lote(
    session: Session,
    dados: HorarioLoteCreate,
    agora: datetime | None = None,
) -> Sequence[Horario]:
    horarios = gerar_horarios_do_lote(dados)
    referencia = agora or datetime.now(horarios[0].inicio.tzinfo if horarios else None)

    if any(horario.inicio <= referencia for horario in horarios):
        raise HorarioNoPassadoError("não é permitido cadastrar horário no passado")

    conflitos_no_lote = _buscar_conflitos_no_lote(horarios)
    conflitos_existentes = _buscar_conflitos_existentes(session, horarios)
    if conflitos_no_lote or conflitos_existentes:
        raise HorariosLoteConflitantesError(
            conflitos_existentes,
            conflitos_no_lote,
        )

    return [criar_horario(session, horario) for horario in horarios]


def gerar_horarios_do_lote(dados: HorarioLoteCreate) -> list[HorarioCreate]:
    if dados.data_inicio > dados.data_fim:
        raise IntervaloHorarioInvalidoError(
            "data_inicio deve ser anterior ou igual a data_fim"
        )
    if dados.inicio_periodo >= dados.fim_periodo:
        raise IntervaloHorarioInvalidoError(
            "inicio_periodo deve ser anterior a fim_periodo"
        )

    duracao = timedelta(minutes=dados.duracao_minutos)
    inicio_referencia = datetime.combine(date.min, dados.inicio_periodo)
    fim_referencia = datetime.combine(date.min, dados.fim_periodo)
    if (fim_referencia - inicio_referencia) % duracao:
        raise IntervaloHorarioInvalidoError(
            "o período deve ser divisível pela duração de cada atendimento"
        )

    horarios: list[HorarioCreate] = []
    data_atual = dados.data_inicio
    while data_atual <= dados.data_fim:
        if _dia_semana(data_atual) in dados.dias_semana:
            inicio = datetime.combine(data_atual, dados.inicio_periodo)
            fim_periodo = datetime.combine(data_atual, dados.fim_periodo)

            while inicio < fim_periodo:
                fim = inicio + duracao
                horarios.append(
                    HorarioCreate(
                        medico_id=dados.medico_id,
                        inicio=inicio,
                        fim=fim,
                    )
                )
                inicio = fim

        data_atual += timedelta(days=1)

    return horarios


def _dia_semana(data: date) -> DiaSemana:
    return tuple(DiaSemana)[data.weekday()]


def _buscar_conflitos_no_lote(
    horarios: Sequence[HorarioCreate],
) -> list[HorarioCreate]:
    conflitos: list[HorarioCreate] = []
    horario_anterior: HorarioCreate | None = None

    for horario in sorted(
        horarios, key=lambda item: (item.medico_id, item.inicio, item.fim)
    ):
        if (
            horario_anterior
            and horario.medico_id == horario_anterior.medico_id
            and horario.inicio < horario_anterior.fim
        ):
            conflitos.extend((horario_anterior, horario))

        if (
            horario_anterior is None
            or horario.medico_id != horario_anterior.medico_id
            or horario.fim > horario_anterior.fim
        ):
            horario_anterior = horario

    conflitos_unicos = {
        (horario.medico_id, horario.inicio, horario.fim): horario
        for horario in conflitos
    }
    return list(conflitos_unicos.values())


def _buscar_conflitos_existentes(
    session: Session,
    horarios: Sequence[HorarioCreate],
) -> list[Horario]:
    conflitos: dict[uuid.UUID, Horario] = {}

    for horario in horarios:
        encontrados = buscar_horarios_sobrepostos(
            session,
            horario.medico_id,
            horario.inicio,
            horario.fim,
        )
        conflitos.update({conflito.id: conflito for conflito in encontrados})

    return list(conflitos.values())


def desativar_horario(session: Session, horario_id: uuid.UUID) -> Horario:
    horario = buscar_horario_por_id(session, horario_id)
    if horario is None:
        raise HorarioNaoEncontradoError(horario_id)
    if not horario.ativo:
        raise HorarioJaInativoError(horario_id)
    horario.ativo = False
    session.flush()
    return horario
