import uuid
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import agendamentos as api_agendamentos
from app.database import get_db
from app.schemas.agendamento import AgendamentoListagemResponse, AgendamentoPage
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


def criar_item_mock() -> AgendamentoListagemResponse:
    return AgendamentoListagemResponse(
        id=uuid.uuid4(),
        cliente="Ana Paula Ribeiro",
        medico="Dra. Mariana Alves",
        especialidade="Cardiologia",
        data="10/08/2026",
        horario="08:00-09:00",
        status="AGENDADO",
    )


def pagina_mock() -> AgendamentoPage:
    item = criar_item_mock()
    return AgendamentoPage(
        items=[item],
        page=1,
        size=5,
        total=1,
        totalPages=1,
    )


def test_lista_agendamentos_retorna_pagina_correta(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    pagina = pagina_mock()
    listar = MagicMock(return_value=pagina)
    monkeypatch.setattr(api_agendamentos, "listar_agendamentos_service", listar)

    resposta = client.get("/api/agendamentos")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["page"] == 1
    assert dados["size"] == 5
    assert dados["total"] == 1
    assert dados["totalPages"] == 1
    assert len(dados["items"]) == 1
    assert dados["items"][0]["cliente"] == "Ana Paula Ribeiro"
    listar.assert_called_once_with(session, 1, 5)
    session.commit.assert_not_called()


def test_lista_agendamentos_repassa_page_e_size(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    pagina = pagina_mock()
    listar = MagicMock(return_value=pagina)
    monkeypatch.setattr(api_agendamentos, "listar_agendamentos_service", listar)

    resposta = client.get("/api/agendamentos?page=2&size=10")

    assert resposta.status_code == 200
    listar.assert_called_once_with(session, 2, 10)


def test_lista_agendamentos_default_size_5(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    pagina = pagina_mock()
    listar = MagicMock(return_value=pagina)
    monkeypatch.setattr(api_agendamentos, "listar_agendamentos_service", listar)

    resposta = client.get("/api/agendamentos")

    assert resposta.status_code == 200
    listar.assert_called_once_with(session, 1, 5)


@pytest.mark.parametrize("page", [0, -1])
def test_rejeita_page_invalido(client: TestClient, page: int) -> None:
    resposta = client.get(f"/api/agendamentos?page={page}")

    assert resposta.status_code == 422


@pytest.mark.parametrize("size", [0, -1, 101])
def test_rejeita_size_invalido(client: TestClient, size: int) -> None:
    resposta = client.get(f"/api/agendamentos?size={size}")

    assert resposta.status_code == 422


def test_lista_agendamentos_vazia_retorna_items_vazio(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    pagina = AgendamentoPage(
        items=[],
        page=1,
        size=5,
        total=0,
        totalPages=1,
    )
    listar = MagicMock(return_value=pagina)
    monkeypatch.setattr(api_agendamentos, "listar_agendamentos_service", listar)

    resposta = client.get("/api/agendamentos")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["items"] == []
    assert dados["total"] == 0
    assert dados["totalPages"] == 1