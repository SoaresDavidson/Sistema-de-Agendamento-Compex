import uuid
from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace

from app.schemas.horario import (
    HorarioCreate,
    HorarioDisponivelFiltros,
    HorarioDisponivelResponse,
    HorarioResponse,
)


def test_schema_de_criacao_possui_apenas_dados_de_entrada() -> None:
    inicio = datetime.now(UTC) + timedelta(days=1)
    dados = HorarioCreate(
        medico_id=uuid.uuid4(),
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )

    assert set(dados.model_dump()) == {"medico_id", "inicio", "fim"}


def test_schema_de_resposta_serializa_modelo_orm() -> None:
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = SimpleNamespace(
        id=uuid.uuid4(),
        medico_id=uuid.uuid4(),
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )

    resposta = HorarioResponse.model_validate(horario)

    assert resposta.id == horario.id
    assert resposta.medico_id == horario.medico_id
    assert resposta.ativo is True
    assert "disponivel" not in resposta.model_dump()


def test_filtros_de_horarios_disponiveis_sao_opcionais() -> None:
    filtros = HorarioDisponivelFiltros()

    assert filtros.model_dump() == {
        "data": None,
        "medico_id": None,
        "especialidade_id": None,
    }


def test_filtros_de_horarios_disponiveis_aceitam_combinacao() -> None:
    data = date(2030, 1, 7)
    medico_id = uuid.uuid4()
    especialidade_id = uuid.uuid4()

    filtros = HorarioDisponivelFiltros(
        data=data,
        medico_id=medico_id,
        especialidade_id=especialidade_id,
    )

    assert filtros.data == data
    assert filtros.medico_id == medico_id
    assert filtros.especialidade_id == especialidade_id


def test_resposta_de_horario_disponivel_identifica_medico_e_periodo() -> None:
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = SimpleNamespace(
        id=uuid.uuid4(),
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        medico=SimpleNamespace(id=uuid.uuid4(), nome="Dra. Ana"),
        ativo=True,
    )

    resposta = HorarioDisponivelResponse.model_validate(horario)

    assert resposta.id == horario.id
    assert resposta.inicio == horario.inicio
    assert resposta.fim == horario.fim
    assert resposta.medico.id == horario.medico.id
    assert resposta.medico.nome == horario.medico.nome
    assert "ativo" not in resposta.model_dump()
    assert "disponivel" not in resposta.model_dump()
