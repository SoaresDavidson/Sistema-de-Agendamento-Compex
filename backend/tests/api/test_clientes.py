import uuid
from collections.abc import Iterator
from datetime import date
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import clientes as api_clientes
from app.database import get_db
from app.models.cliente import Client
from app.schemas.clientes import ClientePage
from app.services.cliente import ClienteDuplicado
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


def criar_modelo() -> Client:
    return Client(
        id=uuid.uuid4(),
        nome="Ana Silva",
        telefone="85999999999",
        email="ana@example.com",
        data_nascimento=date(1990, 5, 10),
    )


def payload_valido() -> dict[str, object]:
    return {
        "nome": "  Ana   Silva  ",
        "telefone": "85999999999",
        "email": "ana@example.com",
        "data_nascimento": "1990-05-10",
    }


def test_cria_cliente_e_retorna_dados_normalizados(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente = criar_modelo()
    criar = MagicMock(return_value=cliente)
    monkeypatch.setattr(api_clientes, "criar_cliente_service", criar)

    resposta = client.post("/api/clientes", json=payload_valido())

    assert resposta.status_code == 201
    assert resposta.json() == {
        "id": str(cliente.id),
        "nome": "Ana Silva",
        "telefone": "85999999999",
        "email": "ana@example.com",
        "data_nascimento": "1990-05-10",
    }
    dados_recebidos = criar.call_args.args[1]
    assert dados_recebidos.nome == "Ana Silva"
    assert dados_recebidos.confirmar_duplicidade is False
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


@pytest.mark.parametrize(
    "alteracao",
    [
        {"nome": ""},
        {"telefone": ""},
        {"email": "email-invalido"},
        {"data_nascimento": ""},
        {"data_nascimento": "2999-01-01"},
    ],
)
def test_rejeita_payload_invalido_antes_de_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    alteracao: dict[str, object],
) -> None:
    criar = MagicMock()
    monkeypatch.setattr(api_clientes, "criar_cliente_service", criar)
    payload = payload_valido() | alteracao

    resposta = client.post("/api/clientes", json=payload)

    assert resposta.status_code == 422
    assert isinstance(resposta.json()["detail"], list)
    criar.assert_not_called()


def test_lista_clientes_com_paginacao_por_cursor(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente = criar_modelo()
    cursor = uuid.uuid4()
    proximo_cursor = uuid.uuid4()
    listar = MagicMock(
        return_value=ClientePage(
            items=[cliente],
            next_cursor=str(proximo_cursor),
        )
    )
    monkeypatch.setattr(api_clientes, "listar_clientes_service", listar)

    resposta = client.get(f"/api/clientes?cursor={cursor}&limite=10")

    assert resposta.status_code == 200
    assert resposta.json()["items"][0]["id"] == str(cliente.id)
    assert resposta.json()["next_cursor"] == str(proximo_cursor)
    listar.assert_called_once_with(session, cursor, 10)
    session.commit.assert_not_called()


@pytest.mark.parametrize("limite", [0, 101])
def test_rejeita_limite_fora_do_intervalo(
    client: TestClient,
    limite: int,
) -> None:
    resposta = client.get(f"/api/clientes?limite={limite}")

    assert resposta.status_code == 422


def test_cliente_duplicado_requer_confirmacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_clientes,
        "criar_cliente_service",
        MagicMock(side_effect=ClienteDuplicado("Possível cliente duplicado")),
    )

    resposta = client.post(
        "/api/clientes",
        json={
            "nome": "Ana Silva",
            "telefone": "85999999999",
            "email": "ana@example.com",
            "data_nascimento": "1990-05-10",
        },
    )

    assert resposta.status_code == 409
    assert resposta.json() == {
        "detail": {
            "mensagem": "Possível cliente duplicado",
            "requer_confirmacao": True,
        }
    }
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_envia_confirmacao_explicita_ao_service(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente = criar_modelo()
    criar = MagicMock(return_value=cliente)
    monkeypatch.setattr(api_clientes, "criar_cliente_service", criar)
    payload = payload_valido() | {"confirmar_duplicidade": True}

    resposta = client.post("/api/clientes", json=payload)

    assert resposta.status_code == 201
    dados_recebidos = criar.call_args.args[1]
    assert dados_recebidos.confirmar_duplicidade is True
    session.commit.assert_called_once_with()
