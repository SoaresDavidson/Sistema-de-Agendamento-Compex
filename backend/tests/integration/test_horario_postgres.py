import os
import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import Column, Table, Uuid, create_engine, insert
from sqlalchemy.orm import Session

from app.models import Base
from app.repositories.horario import (
    buscar_horario_por_id,
    criar_horario,
    listar_horarios,
)
from app.schemas.horario import HorarioCreate

pytestmark = pytest.mark.integration


@pytest.fixture
def banco_postgres() -> Generator[tuple[Session, uuid.UUID]]:
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)
    medico_id = uuid.uuid4()

    medicos = Base.metadata.tables.get("medicos")
    if medicos is None:
        medicos = Table(
            "medicos",
            Base.metadata,
            Column("id", Uuid(as_uuid=True), primary_key=True),
        )

    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            Base.metadata.create_all(connection)
            connection.execute(insert(medicos).values(id=medico_id))

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


def test_cria_e_consulta_horario_no_postgres(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    inicio = datetime.now(UTC) + timedelta(days=1)
    dados = HorarioCreate(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )

    horario_criado = criar_horario(session, dados)
    horario_id = horario_criado.id
    session.expunge_all()

    horario_encontrado = buscar_horario_por_id(session, horario_id)
    horarios = listar_horarios(session)

    assert horario_encontrado is not None
    assert horario_encontrado.id == horario_id
    assert horario_encontrado.medico_id == medico_id
    assert horario_encontrado.inicio == inicio
    assert horario_encontrado.fim == dados.fim
    assert horario_encontrado.ativo is True
    assert [horario.id for horario in horarios] == [horario_id]
