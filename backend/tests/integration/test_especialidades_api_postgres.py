import os
import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.especialidade import Especialidade
from main import app

pytestmark = pytest.mark.integration


@pytest.fixture
def client_especialidades_postgres() -> Generator[tuple[TestClient, Session]]:
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)
    with engine.connect() as connection:
        transaction = connection.begin()
        schema = f"test_api_especialidades_{uuid.uuid4().hex}"
        try:
            connection.exec_driver_sql(f'CREATE SCHEMA "{schema}"')
            connection.exec_driver_sql(f'SET LOCAL search_path TO "{schema}"')
            Especialidade.__table__.create(connection)
            with Session(
                bind=connection,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            ) as session:
                app.dependency_overrides[get_db] = lambda: session
                with TestClient(app) as client:
                    yield client, session
        finally:
            app.dependency_overrides.clear()
            if transaction.is_active:
                transaction.rollback()
    engine.dispose()


def test_post_persiste_especialidade_normalizada(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres

    resposta = client.post("/api/especialidades", json={"nome": "  Clínica   Médica  "})

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert uuid.UUID(corpo["id"])
    assert corpo["nome"] == "Clínica Médica"
    assert session.scalar(select(Especialidade.nome)) == "Clínica Médica"


@pytest.mark.parametrize("payload", [{}, {"nome": ""}, {"nome": "   "}])
def test_post_invalido_nao_persiste_especialidade(
    client_especialidades_postgres: tuple[TestClient, Session],
    payload: dict[str, str],
) -> None:
    client, session = client_especialidades_postgres

    resposta = client.post("/api/especialidades", json=payload)

    assert resposta.status_code == 422
    assert session.scalar(select(func.count()).select_from(Especialidade)) == 0


def test_post_duplicado_sem_diferenciar_maiusculas_nao_cria_segundo_registro(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres

    primeira = client.post("/api/especialidades", json={"nome": "Cardiologia"})
    duplicada = client.post("/api/especialidades", json={"nome": "  CARDIOLOGIA "})

    assert primeira.status_code == 201
    assert duplicada.status_code == 409
    assert session.scalar(select(func.count()).select_from(Especialidade)) == 1


def test_get_retorna_colecao_vazia(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, _ = client_especialidades_postgres

    resposta = client.get("/api/especialidades")

    assert resposta.status_code == 200
    assert resposta.json() == {"items": [], "next_cursor": None}


def test_get_aplica_cursor_e_limite(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, _ = client_especialidades_postgres
    for nome in ("Cardiologia", "Dermatologia"):
        resposta = client.post("/api/especialidades", json={"nome": nome})
        assert resposta.status_code == 201

    primeira_pagina = client.get("/api/especialidades?limite=1")

    assert primeira_pagina.status_code == 200
    primeiro_corpo = primeira_pagina.json()
    assert len(primeiro_corpo["items"]) == 1
    assert primeiro_corpo["next_cursor"] == primeiro_corpo["items"][0]["id"]

    segunda_pagina = client.get(
        f"/api/especialidades?cursor={primeiro_corpo['next_cursor']}&limite=1"
    )

    assert segunda_pagina.status_code == 200
    segundo_corpo = segunda_pagina.json()
    assert len(segundo_corpo["items"]) == 1
    assert segundo_corpo["next_cursor"] is None
    assert {primeiro_corpo["items"][0]["id"], segundo_corpo["items"][0]["id"]} == {
        item["id"]
        for item in client.get("/api/especialidades?limite=2").json()["items"]
    }


def test_patch_normaliza_e_persiste_especialidade(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres
    criada = client.post("/api/especialidades", json={"nome": "Cardiologia"})
    especialidade_id = criada.json()["id"]

    resposta = client.patch(
        f"/api/especialidades/{especialidade_id}",
        json={"nome": "  Cardiologia   Pediátrica  "},
    )

    assert resposta.status_code == 200
    assert resposta.json() == {
        "id": especialidade_id,
        "nome": "Cardiologia Pediátrica",
    }
    assert session.get(Especialidade, uuid.UUID(especialidade_id)).nome == (
        "Cardiologia Pediátrica"
    )


def test_patch_permite_nome_normalizado_do_proprio_registro(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres
    criada = client.post("/api/especialidades", json={"nome": "Clínica Médica"})
    especialidade_id = criada.json()["id"]

    resposta = client.patch(
        f"/api/especialidades/{especialidade_id}",
        json={"nome": "  CLÍNICA   MÉDICA  "},
    )

    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "CLÍNICA MÉDICA"
    assert session.scalar(select(func.count()).select_from(Especialidade)) == 1


def test_patch_rejeita_nome_normalizado_de_outro_registro_sem_alterar_original(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres
    cardiologia = client.post(
        "/api/especialidades",
        json={"nome": "Cardiologia"},
    ).json()
    client.post("/api/especialidades", json={"nome": "Clínica Médica"})

    resposta = client.patch(
        f"/api/especialidades/{cardiologia['id']}",
        json={"nome": "  CLÍNICA   MÉDICA  "},
    )

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": {"mensagem": "Especialidade já cadastrada."}}
    assert (
        session.get(Especialidade, uuid.UUID(cardiologia["id"])).nome == "Cardiologia"
    )
    assert session.scalar(select(func.count()).select_from(Especialidade)) == 2


def test_patch_id_inexistente_retorna_404_sem_criar_registro(
    client_especialidades_postgres: tuple[TestClient, Session],
) -> None:
    client, session = client_especialidades_postgres

    resposta = client.patch(
        f"/api/especialidades/{uuid.uuid4()}",
        json={"nome": "Cardiologia"},
    )

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": {"mensagem": "Especialidade não encontrada."}}
    assert session.scalar(select(func.count()).select_from(Especialidade)) == 0


@pytest.mark.parametrize("payload", [{}, {"nome": ""}, {"nome": "   "}])
def test_patch_payload_invalido_retorna_422_sem_alterar_registro(
    client_especialidades_postgres: tuple[TestClient, Session],
    payload: dict[str, str],
) -> None:
    client, session = client_especialidades_postgres
    criada = client.post("/api/especialidades", json={"nome": "Cardiologia"}).json()

    resposta = client.patch(
        f"/api/especialidades/{criada['id']}",
        json=payload,
    )

    assert resposta.status_code == 422
    assert session.get(Especialidade, uuid.UUID(criada["id"])).nome == "Cardiologia"
