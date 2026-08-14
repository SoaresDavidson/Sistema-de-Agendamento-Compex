import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import agendamentos as api_agendamentos
from app.database import get_db
from app.models.agendamento import Agendamento, CancelamentoOrigem, StatusAgendamento
from main import app


@pytest.fixture
def session() -> MagicMock:
    return MagicMock(spec=Session)


@pytest.fixture
def client(session: MagicMock) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def criar_agendamento(
    status: StatusAgendamento = StatusAgendamento.AGENDADO,
) -> Agendamento:
    return Agendamento(
        id=uuid.uuid4(),
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
        status=status,
    )


def payload_valido() -> dict[str, object]:
    return {"origem": "CLIENTE", "observacao": "Paciente desmarcou"}


def test_cancelar_retorna_404_quando_agendamento_nao_existe(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_agendamentos,
        "validar_cancelamento",
        MagicMock(
            side_effect=api_agendamentos.AgendamentoNaoEncontradoError(uuid.uuid4())
        ),
    )

    resposta = client.patch(
        f"/api/agendamentos/{uuid.uuid4()}/cancelar",
        json=payload_valido(),
    )

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Agendamento não encontrado"}


def test_cancelar_retorna_409_quando_agendamento_ja_cancelado(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_agendamentos,
        "validar_cancelamento",
        MagicMock(
            side_effect=api_agendamentos.AgendamentoJaCanceladoError(uuid.uuid4())
        ),
    )

    resposta = client.patch(
        f"/api/agendamentos/{uuid.uuid4()}/cancelar",
        json=payload_valido(),
    )

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Agendamento já está cancelado"}


def test_cancelar_retorna_422_quando_origem_invalida(
    client: TestClient,
) -> None:
    resposta = client.patch(
        f"/api/agendamentos/{uuid.uuid4()}/cancelar",
        json={"origem": "SECRETARIO"},
    )

    assert resposta.status_code == 422


def test_cancelar_caminho_valido_nao_persiste(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    agendamento_id = uuid.uuid4()
    agendamento = Agendamento(
        id=agendamento_id,
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
        status=StatusAgendamento.AGENDADO,
    )
    monkeypatch.setattr(
        api_agendamentos,
        "validar_cancelamento",
        MagicMock(return_value=agendamento),
    )

    # Mock aplicar_cancelamento para retornar o agendamento com os campos preenchidos
    agora = datetime.now(UTC)
    monkeypatch.setattr(
        api_agendamentos,
        "aplicar_cancelamento",
        MagicMock(
            return_value=Agendamento(
                id=agendamento_id,
                cliente_id=agendamento.cliente_id,
                horario_id=agendamento.horario_id,
                status=StatusAgendamento.CANCELADO,
                cancelado_por=CancelamentoOrigem.CLIENTE,
                cancelado_em=agora,
                observacao_cancelamento="Paciente desmarcou",
            )
        ),
    )

    resposta = client.patch(
        f"/api/agendamentos/{agendamento_id}/cancelar",
        json=payload_valido(),
    )

    assert resposta.status_code == 200
    resposta_json = resposta.json()
    assert resposta_json["id"] == str(agendamento_id)
    assert resposta_json["status"] == StatusAgendamento.CANCELADO.value
    assert resposta_json["cancelado_por"] == "CLIENTE"
    assert resposta_json["observacao_cancelamento"] == "Paciente desmarcou"
    # Verifica que cancelado_em é um datetime válido em UTC (aceita Z ou +00:00)
    cancelado_em = resposta_json["cancelado_em"]
    assert cancelado_em is not None
    dt = datetime.fromisoformat(cancelado_em)
    assert dt.tzinfo is not None
    assert dt.utcoffset().total_seconds() == 0
    session.commit.assert_called_once()
