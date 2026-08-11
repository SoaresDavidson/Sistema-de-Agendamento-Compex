import os
import uuid
from collections.abc import Generator

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, insert
from sqlalchemy.orm import Session

from app.models import Base

# Carrega variáveis de backend/.env para o processo do pytest, espelhando
# o comportamento de app/database.py. Habilita rodar `uv run pytest` sem
# precisar prefixar DATABASE_URL=... no shell.
load_dotenv()

# Marcador reusado por testes que precisam de PostgreSQL.
pytestmark_integration = pytest.mark.integration


@pytest.fixture
def banco_postgres() -> Generator[tuple[Session, uuid.UUID]]:
    """Sobe um PostgreSQL efêmero via DATABASE_URL + transação rollback-able.

    Cria tabelas registradas no metadata e um médico para satisfazer a foreign
    key de `horarios`. Tudo é desfeito ao final, garantindo isolamento total
    entre testes. Pula quando `DATABASE_URL` não está definida.
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)
    medico_id = uuid.uuid4()

    medicos = Base.metadata.tables["medicos"]

    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            Base.metadata.create_all(connection)
            connection.execute(
                insert(medicos).values(id=medico_id, nome="Medico Teste")
            )

            with Session(
                bind=connection,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            ) as session:
                yield session, medico_id
        finally:
            if transaction.is_active:
                transaction.rollback()

    engine.dispose()


@pytest.fixture
def client(
    banco_postgres: tuple[Session, uuid.UUID],
) -> Generator[tuple[object, Session, uuid.UUID]]:
    """TestClient do FastAPI com `get_db` sobrescrito para a sessão do teste.

    Import condicional: `main` importa `app.database`, que exige
    `DATABASE_URL` no nível do módulo. Como `banco_postgres` já validou a
    presença de `DATABASE_URL` antes deste ponto, o import é seguro.
    """
    from starlette.testclient import TestClient

    from app.database import get_db
    from main import app

    session, medico_id = banco_postgres
    app.dependency_overrides[get_db] = lambda: session
    try:
        yield TestClient(app), session, medico_id
    finally:
        app.dependency_overrides.clear()
