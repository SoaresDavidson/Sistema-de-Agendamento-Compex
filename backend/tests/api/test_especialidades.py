import uuid
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.routers import especialidades as api_especialidades
from app.database import get_db
from app.models.especialidade import Especialidade
from app.schemas.especialidade import EspecialidadePage
from app.services.especialidade import EspecialidadeDuplicada
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


def criar_especialidade() -> Especialidade:
    return Especialidade(id=uuid.uuid4(), nome="Cardiologia")


def test_cria_especialidade_normalizada_e_commita(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    especialidade = criar_especialidade()
    criar = MagicMock(return_value=especialidade)
    monkeypatch.setattr(api_especialidades, "criar_especialidade_service", criar)

    resposta = client.post("/api/especialidades", json={"nome": "  Cardiologia  "})

    assert resposta.status_code == 201
    assert resposta.json() == {"id": str(especialidade.id), "nome": "Cardiologia"}
    assert criar.call_args.args[1].nome == "Cardiologia"
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


@pytest.mark.parametrize("payload", [{}, {"nome": ""}, {"nome": "   "}])
def test_rejeita_nome_invalido_sem_chamar_persistencia(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    payload: dict[str, str],
) -> None:
    criar = MagicMock()
    monkeypatch.setattr(api_especialidades, "criar_especialidade_service", criar)

    resposta = client.post("/api/especialidades", json=payload)

    assert resposta.status_code == 422
    criar.assert_not_called()
    session.commit.assert_not_called()
    session.rollback.assert_not_called()


def test_rejeita_especialidade_duplicada_e_reverte_transacao(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_especialidades,
        "criar_especialidade_service",
        MagicMock(side_effect=EspecialidadeDuplicada("Especialidade já cadastrada.")),
    )

    resposta = client.post("/api/especialidades", json={"nome": "cardiologia"})

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": {"mensagem": "Especialidade já cadastrada."}}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_reverte_integrity_error_sem_retornar_sucesso(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_especialidades,
        "criar_especialidade_service",
        MagicMock(side_effect=IntegrityError("INSERT", {}, Exception("duplicada"))),
    )

    resposta = client.post("/api/especialidades", json={"nome": "Cardiologia"})

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": {"mensagem": "Especialidade já cadastrada."}}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_lista_especialidades_com_cursor_e_limite(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cursor = uuid.uuid4()
    proximo_cursor = uuid.uuid4()
    especialidade = criar_especialidade()
    listar = MagicMock(
        return_value=EspecialidadePage(
            items=[especialidade], next_cursor=str(proximo_cursor)
        )
    )
    monkeypatch.setattr(api_especialidades, "listar_especialidades_service", listar)

    resposta = client.get(f"/api/especialidades?cursor={cursor}&limite=10")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "items": [{"id": str(especialidade.id), "nome": "Cardiologia"}],
        "next_cursor": str(proximo_cursor),
    }
    listar.assert_called_once_with(session, cursor, 10)
