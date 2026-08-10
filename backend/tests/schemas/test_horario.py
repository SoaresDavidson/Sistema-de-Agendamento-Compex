import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from app.schemas.horario import HorarioCreate, HorarioResponse


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
