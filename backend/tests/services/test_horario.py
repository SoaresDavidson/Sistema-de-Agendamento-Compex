import uuid
from datetime import UTC, date, datetime, time, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.horario import Horario
from app.schemas.horario import DiaSemana, HorarioCreate, HorarioLoteCreate
from app.services import horario as servico_horario
from app.services.horario import (
    HorarioConflitanteError,
    HorarioNoPassadoError,
    HorariosLoteConflitantesError,
    IntervaloHorarioInvalidoError,
    cadastrar_horario_individual,
    cadastrar_horarios_em_lote,
    gerar_horarios_do_lote,
)


def criar_horario_create(
    inicio: datetime | None = None,
    medico_id: uuid.UUID | None = None,
) -> HorarioCreate:
    inicio = inicio or datetime(2030, 1, 7, 8, tzinfo=UTC)
    return HorarioCreate(
        medico_id=medico_id or uuid.uuid4(),
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )


def criar_lote(
    **alteracoes: object,
) -> HorarioLoteCreate:
    dados = {
        "medico_id": uuid.uuid4(),
        "data_inicio": date(2030, 1, 7),
        "data_fim": date(2030, 1, 7),
        "dias_semana": {DiaSemana.SEGUNDA},
        "inicio_periodo": time(8),
        "fim_periodo": time(12),
        "duracao_minutos": 60,
    }
    dados.update(alteracoes)
    return HorarioLoteCreate(**dados)


def test_cadastro_individual_persiste_horario_sem_conflitos(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    dados = criar_horario_create()
    horario_esperado = MagicMock(spec=Horario)
    monkeypatch.setattr(servico_horario, "buscar_horarios_sobrepostos", lambda *_: [])
    monkeypatch.setattr(
        servico_horario,
        "criar_horario",
        lambda _, horario: horario_esperado,
    )

    horario = cadastrar_horario_individual(
        session,
        dados,
        agora=datetime(2030, 1, 1, tzinfo=UTC),
    )

    assert horario is horario_esperado


@pytest.mark.parametrize(
    "inicio, fim",
    [
        (datetime(2030, 1, 7, 9, tzinfo=UTC), datetime(2030, 1, 7, 9, tzinfo=UTC)),
        (datetime(2030, 1, 7, 10, tzinfo=UTC), datetime(2030, 1, 7, 9, tzinfo=UTC)),
    ],
)
def test_cadastro_individual_rejeita_intervalo_invalido(
    inicio: datetime,
    fim: datetime,
) -> None:
    dados = HorarioCreate(medico_id=uuid.uuid4(), inicio=inicio, fim=fim)

    with pytest.raises(IntervaloHorarioInvalidoError):
        cadastrar_horario_individual(MagicMock(spec=Session), dados)


def test_cadastro_individual_rejeita_horario_no_passado() -> None:
    dados = criar_horario_create()

    with pytest.raises(HorarioNoPassadoError):
        cadastrar_horario_individual(
            MagicMock(spec=Session),
            dados,
            agora=datetime(2030, 1, 8, tzinfo=UTC),
        )


def test_cadastro_individual_informa_conflitos_existentes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    conflito = Horario(
        medico_id=uuid.uuid4(),
        inicio=datetime(2030, 1, 7, 8, tzinfo=UTC),
        fim=datetime(2030, 1, 7, 9, tzinfo=UTC),
    )
    monkeypatch.setattr(
        servico_horario,
        "buscar_horarios_sobrepostos",
        lambda *_: [conflito],
    )

    with pytest.raises(HorarioConflitanteError) as erro:
        cadastrar_horario_individual(
            MagicMock(spec=Session),
            criar_horario_create(),
            agora=datetime(2030, 1, 1, tzinfo=UTC),
        )

    assert erro.value.conflitos == (conflito,)


def test_gera_blocos_para_dias_selecionados() -> None:
    horarios = gerar_horarios_do_lote(criar_lote())

    assert [(horario.inicio.time(), horario.fim.time()) for horario in horarios] == [
        (time(8), time(9)),
        (time(9), time(10)),
        (time(10), time(11)),
        (time(11), time(12)),
    ]


@pytest.mark.parametrize(
    "alteracoes",
    [
        {"data_inicio": date(2030, 1, 8), "data_fim": date(2030, 1, 7)},
        {"inicio_periodo": time(12), "fim_periodo": time(8)},
        {"inicio_periodo": time(8), "fim_periodo": time(10), "duracao_minutos": 45},
    ],
)
def test_lote_rejeita_intervalos_invalidos(alteracoes: dict[str, object]) -> None:
    with pytest.raises(IntervaloHorarioInvalidoError):
        gerar_horarios_do_lote(criar_lote(**alteracoes))


def test_lote_rejeita_horarios_no_passado_antes_de_persistir() -> None:
    with pytest.raises(HorarioNoPassadoError):
        cadastrar_horarios_em_lote(
            MagicMock(spec=Session),
            criar_lote(),
            agora=datetime(2030, 1, 8),
        )


def test_lote_informa_conflito_existente_sem_persistir(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    conflito = Horario(
        medico_id=uuid.uuid4(),
        inicio=datetime(2030, 1, 7, 8),
        fim=datetime(2030, 1, 7, 9),
    )
    criar_horario = MagicMock()
    monkeypatch.setattr(
        servico_horario,
        "buscar_horarios_sobrepostos",
        lambda *_: [conflito],
    )
    monkeypatch.setattr(servico_horario, "criar_horario", criar_horario)

    with pytest.raises(HorariosLoteConflitantesError) as erro:
        cadastrar_horarios_em_lote(
            MagicMock(spec=Session),
            criar_lote(),
            agora=datetime(2030, 1, 1),
        )

    assert erro.value.conflitos_existentes == (conflito,)
    assert erro.value.conflitos_no_lote == ()
    criar_horario.assert_not_called()


def test_lote_persiste_todos_os_blocos_apos_validacao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    horarios_criados = [MagicMock(spec=Horario) for _ in range(4)]
    criar_horario = MagicMock(side_effect=horarios_criados)
    monkeypatch.setattr(servico_horario, "buscar_horarios_sobrepostos", lambda *_: [])
    monkeypatch.setattr(servico_horario, "criar_horario", criar_horario)

    resultado = cadastrar_horarios_em_lote(
        MagicMock(spec=Session),
        criar_lote(),
        agora=datetime(2030, 1, 1),
    )

    assert resultado == horarios_criados
    assert criar_horario.call_count == 4


def test_conflitos_no_lote_sao_restritos_ao_mesmo_medico() -> None:
    medico_id = uuid.uuid4()
    inicio = datetime(2030, 1, 7, 8)
    horarios = [
        criar_horario_create(inicio, medico_id),
        criar_horario_create(inicio + timedelta(minutes=30), medico_id),
        criar_horario_create(inicio + timedelta(minutes=30), uuid.uuid4()),
    ]

    conflitos = servico_horario._buscar_conflitos_no_lote(horarios)

    assert conflitos == horarios[:2]
