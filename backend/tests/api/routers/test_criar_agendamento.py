import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
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


def payload_valido() -> dict[str, str]:
    return {
        "cliente_id": str(uuid.uuid4()),
        "horario_id": str(uuid.uuid4()),
    }


def criar_agendamento() -> Agendamento:
    return Agendamento(
        id=uuid.uuid4(),
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
        status=StatusAgendamento.AGENDADO,
        criado_em=datetime(2030, 1, 1, tzinfo=UTC),
    )


def test_cria_agendamento_e_confirma_somente_apos_commit(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    agendamento = criar_agendamento()
    realizar = MagicMock(return_value=agendamento)
    monkeypatch.setattr(api_agendamentos, "realizar_agendamento", realizar)
    payload = payload_valido()

    resposta = client.post("/api/agendamentos", json=payload)

    assert resposta.status_code == 201
    assert resposta.json() == {
        "id": str(agendamento.id),
        "cliente_id": str(agendamento.cliente_id),
        "horario_id": str(agendamento.horario_id),
        "status": "AGENDADO",
        "criado_em": "2030-01-01T00:00:00Z",
    }
    realizar.assert_called_once()
    sessao_recebida, dados = realizar.call_args.args
    assert sessao_recebida is session
    assert dados.cliente_id == uuid.UUID(payload["cliente_id"])
    assert dados.horario_id == uuid.UUID(payload["horario_id"])
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"cliente_id": "uuid-invalido", "horario_id": str(uuid.uuid4())},
        {"cliente_id": str(uuid.uuid4()), "horario_id": "uuid-invalido"},
    ],
    ids=["ausente", "cliente", "horario"],
)
def test_rejeita_payload_invalido_antes_de_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    payload: dict[str, str],
) -> None:
    realizar = MagicMock()
    monkeypatch.setattr(api_agendamentos, "realizar_agendamento", realizar)

    resposta = client.post("/api/agendamentos", json=payload)

    assert resposta.status_code == 422
    realizar.assert_not_called()


@pytest.mark.parametrize(
    "erro, detalhe",
    [
        (api_agendamentos.ClienteNaoEncontradoError, "Cliente não encontrado"),
        (
            api_agendamentos.HorarioNaoEncontradoParaAgendamentoError,
            "Horário não encontrado",
        ),
    ],
    ids=["cliente", "horario"],
)
def test_retorna_404_quando_relacionamento_nao_existe(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    erro: type[Exception],
    detalhe: str,
) -> None:
    monkeypatch.setattr(
        api_agendamentos,
        "realizar_agendamento",
        MagicMock(side_effect=erro(uuid.uuid4())),
    )

    resposta = client.post("/api/agendamentos", json=payload_valido())

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": detalhe}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_retorna_409_quando_horario_esta_indisponivel(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_agendamentos,
        "realizar_agendamento",
        MagicMock(side_effect=api_agendamentos.HorarioIndisponivelError()),
    )

    resposta = client.post("/api/agendamentos", json=payload_valido())

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Horário não está mais disponível"}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_retorna_409_quando_banco_detecta_conflito_concorrente(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    conflito = IntegrityError("INSERT", {}, Exception("unicidade"))
    monkeypatch.setattr(
        api_agendamentos,
        "realizar_agendamento",
        MagicMock(side_effect=conflito),
    )

    resposta = client.post("/api/agendamentos", json=payload_valido())

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Horário não está mais disponível"}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_erro_inesperado_executa_rollback_e_nao_indica_sucesso(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_agendamentos,
        "realizar_agendamento",
        MagicMock(side_effect=RuntimeError("falha inesperada")),
    )

    with pytest.raises(RuntimeError, match="falha inesperada"):
        client.post("/api/agendamentos", json=payload_valido())

    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()
