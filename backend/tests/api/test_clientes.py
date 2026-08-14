import uuid
from collections.abc import Iterator
from datetime import UTC, date, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.routers import clientes as api_clientes
from app.database import get_db
from app.models.cliente import Client
from app.schemas.clientes import ClientePage
from app.services.cliente import ClienteDuplicado, ClienteNaoEncontrado
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


def test_atualiza_cliente_parcialmente_e_confirma_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente = criar_modelo()
    cliente.nome = "Ana Maria Silva"
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{cliente.id}",
        json={"nome": "  Ana   Maria Silva  "},
    )

    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "Ana Maria Silva"
    dados_recebidos = atualizar.call_args.args[2]
    assert dados_recebidos.nome == "Ana Maria Silva"
    assert dados_recebidos.model_fields_set == {"nome"}
    atualizar.assert_called_once_with(session, cliente.id, dados_recebidos)
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


def test_patch_aceita_data_nascimento_de_hoje(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    hoje = datetime.now(UTC).date()
    cliente = criar_modelo()
    cliente.data_nascimento = hoje
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{cliente.id}",
        json={"data_nascimento": hoje.isoformat()},
    )

    assert resposta.status_code == 200
    assert resposta.json()["data_nascimento"] == hoje.isoformat()
    dados_recebidos = atualizar.call_args.args[2]
    assert dados_recebidos.data_nascimento == hoje
    assert dados_recebidos.model_fields_set == {"data_nascimento"}
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


@pytest.mark.parametrize("confirmar_duplicidade", [True, False])
def test_patch_apenas_com_confirmacao_retorna_422_sem_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    confirmar_duplicidade: bool,
) -> None:
    atualizar = MagicMock()
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{uuid.uuid4()}",
        json={"confirmar_duplicidade": confirmar_duplicidade},
    )

    assert resposta.status_code == 422
    assert isinstance(resposta.json()["detail"], list)
    atualizar.assert_not_called()


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"nome": ""},
        {"telefone": None},
        {"email": "email-invalido"},
        {"data_nascimento": "2999-01-01"},
    ],
)
def test_rejeita_patch_invalido_antes_de_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    payload: dict[str, object],
) -> None:
    atualizar = MagicMock()
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(f"/api/clientes/{uuid.uuid4()}", json=payload)

    assert resposta.status_code == 422
    assert isinstance(resposta.json()["detail"], list)
    atualizar.assert_not_called()


def test_patch_cliente_inexistente_retorna_404_e_reverte_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente_id = uuid.uuid4()
    atualizar = MagicMock(side_effect=ClienteNaoEncontrado("Cliente não encontrado"))
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{cliente_id}",
        json={"telefone": "85988888888"},
    )

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": {"mensagem": "Cliente não encontrado"}}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_patch_com_uuid_invalido_retorna_422_sem_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    atualizar = MagicMock()
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        "/api/clientes/uuid-invalido",
        json={"telefone": "85988888888"},
    )

    assert resposta.status_code == 422
    atualizar.assert_not_called()
    session.commit.assert_not_called()
    session.rollback.assert_not_called()


def test_patch_duplicado_requer_confirmacao_e_reverte_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    atualizar = MagicMock(side_effect=ClienteDuplicado("Possível cliente duplicado"))
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{uuid.uuid4()}",
        json={"nome": "Ana Silva"},
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


def test_patch_envia_confirmacao_explicita_ao_service(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente = criar_modelo()
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(api_clientes, "atualizar_cliente_service", atualizar)

    resposta = client.patch(
        f"/api/clientes/{cliente.id}",
        json={"nome": cliente.nome, "confirmar_duplicidade": True},
    )

    assert resposta.status_code == 200
    dados_recebidos = atualizar.call_args.args[2]
    assert dados_recebidos.confirmar_duplicidade is True
    assert dados_recebidos.model_fields_set == {"nome", "confirmar_duplicidade"}
    session.commit.assert_called_once_with()


def test_exclui_cliente_e_confirma_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente_id = uuid.uuid4()
    apagar = MagicMock()
    monkeypatch.setattr(api_clientes, "apagar_cliente_service", apagar)

    resposta = client.delete(f"/api/clientes/{cliente_id}")

    assert resposta.status_code == 204
    assert resposta.content == b""
    apagar.assert_called_once_with(session, cliente_id)
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


def test_excluir_cliente_inexistente_retorna_404_e_reverte_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente_id = uuid.uuid4()
    apagar = MagicMock(side_effect=ClienteNaoEncontrado("Cliente não encontrado"))
    monkeypatch.setattr(api_clientes, "apagar_cliente_service", apagar)

    resposta = client.delete(f"/api/clientes/{cliente_id}")

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": {"mensagem": "Cliente não encontrado"}}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_excluir_mapeia_integrity_error_no_commit_para_409_e_rollback(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente_id = uuid.uuid4()
    apagar = MagicMock()
    monkeypatch.setattr(api_clientes, "apagar_cliente_service", apagar)
    session.commit.side_effect = IntegrityError(
        "DELETE FROM clientes WHERE id = :id",
        {"id": cliente_id},
        Exception("foreign key violation concorrente"),
    )

    resposta = client.delete(f"/api/clientes/{cliente_id}")

    assert resposta.status_code == 409
    assert resposta.json() == {
        "detail": {"mensagem": "Cliente possui agendamentos e não pode ser excluído"}
    }
    apagar.assert_called_once_with(session, cliente_id)
    session.commit.assert_called_once_with()
    session.rollback.assert_called_once_with()
