import uuid
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import agendamentos as api_agendamentos
from app.database import get_db
from app.models.agendamento import Agendamento, StatusAgendamento
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
    agendamento = criar_agendamento()
    monkeypatch.setattr(
        api_agendamentos,
        "validar_cancelamento",
        MagicMock(return_value=agendamento),
    )

    resposta = client.patch(
        f"/api/agendamentos/{agendamento.id}/cancelar",
        json=payload_valido(),
    )

    assert resposta.status_code == 200
    assert resposta.json() == {
        "id": str(agendamento.id),
        "status": StatusAgendamento.AGENDADO.value,
    }
    session.commit.assert_not_called()
