import uuid
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import medicos as api_medicos
from app.database import get_db
from app.models.medico import Medico
from app.schemas.medico import MedicoPage
from app.services.medico import EspecialidadeInexistente, MedicoSemEspecialidade
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


def criar_medico() -> Medico:
    return Medico(id=uuid.uuid4(), nome="Dra. Mariana Alves")


def payload_valido() -> dict[str, object]:
    return {
        "nome": "Dra. Mariana Alves",
        "especialidades_id": [str(uuid.uuid4())],
    }


def test_cria_medico_e_commita(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    medico = criar_medico()
    criar = MagicMock(return_value=medico)
    monkeypatch.setattr(api_medicos, "cadastrar_medico_service", criar)

    resposta = client.post("/api/medicos", json=payload_valido())

    assert resposta.status_code == 201
    assert resposta.json()["id"] == str(medico.id)
    assert resposta.json()["nome"] == medico.nome
    criar.assert_called_once()
    session.commit.assert_called_once_with()


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"nome": "", "especialidades_id": [str(uuid.uuid4())]},
        {"nome": "Dra. Mariana", "especialidades_id": ["uuid-invalido"]},
    ],
)
def test_rejeita_payload_invalido_antes_de_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    payload: dict[str, object],
) -> None:
    criar = MagicMock()
    monkeypatch.setattr(api_medicos, "cadastrar_medico_service", criar)

    resposta = client.post("/api/medicos", json=payload)

    assert resposta.status_code == 422
    criar.assert_not_called()


def test_retorna_erro_quando_medico_nao_tem_especialidade(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_medicos,
        "cadastrar_medico_service",
        MagicMock(side_effect=MedicoSemEspecialidade()),
    )

    resposta = client.post("/api/medicos", json=payload_valido())

    assert resposta.status_code == 422
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_lista_medicos_com_filtros(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cursor = uuid.uuid4()
    especialidade_id = uuid.uuid4()
    listar = MagicMock(
        return_value=MedicoPage(items=[criar_medico()], next_cursor=None)
    )
    monkeypatch.setattr(api_medicos, "listar_medicos_service", listar)

    resposta = client.get(
        "/api/medicos",
        params={
            "cursor": str(cursor),
            "limite": 10,
            "nome": "Mariana",
            "especialidade_id": str(especialidade_id),
        },
    )

    assert resposta.status_code == 200
    listar.assert_called_once_with(
        session,
        cursor,
        10,
        "Mariana",
        especialidade_id,
    )
    session.commit.assert_not_called()


@pytest.mark.parametrize("limite", [0, 101])
def test_rejeita_limite_invalido(client: TestClient, limite: int) -> None:
    resposta = client.get(f"/api/medicos?limite={limite}")

    assert resposta.status_code == 422


def test_rejeita_filtros_uuid_invalidos(client: TestClient) -> None:
    resposta = client.get("/api/medicos?especialidade_id=uuid-invalido")

    assert resposta.status_code == 422
    
def test_rejeita_especialidade_inexistente(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    especialidade_id = uuid.uuid4()

    monkeypatch.setattr(
        api_medicos,
        "cadastrar_medico_service",
        MagicMock(side_effect=EspecialidadeInexistente()),
    )

    resposta = client.post(
        "/api/medicos",
        json={
            "nome": "Dra. Mariana Alves",
            "especialidades_id": [str(especialidade_id)],
        },
    )

    assert resposta.status_code == 404
    session.rollback.assert_called_once_with()
