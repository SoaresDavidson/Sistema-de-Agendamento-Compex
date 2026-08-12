import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

from app.models.agendamento import StatusAgendamento
from app.schemas.agendamento import AgendamentoCreate, AgendamentoResponse


def test_schema_de_criacao_possui_apenas_ids_relacionados() -> None:
    dados = AgendamentoCreate(
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
    )

    assert set(dados.model_dump()) == {"cliente_id", "horario_id"}
    assert "status" not in dados.model_dump()


def test_schema_de_resposta_serializa_modelo_orm() -> None:
    agendamento = SimpleNamespace(
        id=uuid.uuid4(),
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
        status=StatusAgendamento.AGENDADO,
        criado_em=datetime.now(UTC),
    )

    resposta = AgendamentoResponse.model_validate(agendamento)

    assert resposta.id == agendamento.id
    assert resposta.cliente_id == agendamento.cliente_id
    assert resposta.horario_id == agendamento.horario_id
    assert resposta.status is StatusAgendamento.AGENDADO
    assert resposta.criado_em == agendamento.criado_em
