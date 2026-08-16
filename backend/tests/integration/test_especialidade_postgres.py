import os
import uuid
from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.repositories.especialidade import (
    atualizar_especialidade,
    buscar_especialidade_por_id,
    buscar_especialidade_por_nome_normalizado,
    criar_especialidade,
    listar_especialidade,
)
from app.schemas.especialidade import EspecialidadeCreate, EspecialidadeUpdate

pytestmark = pytest.mark.integration


@pytest.fixture
def banco_postgres_especialidades() -> Generator[Session]:
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)
    with engine.connect() as connection:
        transaction = connection.begin()
        schema = f"test_especialidades_{uuid.uuid4().hex}"

        try:
            connection.exec_driver_sql(f'CREATE SCHEMA "{schema}"')
            connection.exec_driver_sql(f'SET LOCAL search_path TO "{schema}"')
            Especialidade.__table__.create(connection)

            with Session(
                bind=connection,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            ) as session:
                yield session
        finally:
            if transaction.is_active:
                transaction.rollback()

    engine.dispose()


def test_cria_e_lista_especialidade_no_postgres(
    banco_postgres_especialidades: Session,
) -> None:
    session = banco_postgres_especialidades

    especialidade = criar_especialidade(
        session,
        EspecialidadeCreate(nome="Cardiologia"),
    )
    especialidade_id = especialidade.id
    session.expunge_all()

    especialidades, proximo_id = listar_especialidade(session)

    assert [item.id for item in especialidades] == [especialidade_id]
    assert especialidades[0].nome == "Cardiologia"
    assert proximo_id is None


def test_banco_rejeita_especialidade_sem_nome(
    banco_postgres_especialidades: Session,
) -> None:
    with pytest.raises(IntegrityError):
        banco_postgres_especialidades.execute(insert(Especialidade).values())


def test_banco_rejeita_nome_duplicado(
    banco_postgres_especialidades: Session,
) -> None:
    session = banco_postgres_especialidades
    criar_especialidade(session, EspecialidadeCreate(nome="Cardiologia"))

    with pytest.raises(IntegrityError):
        criar_especialidade(session, EspecialidadeCreate(nome="Cardiologia"))


def test_normalizacao_de_espacos_impede_duplicidade(
    banco_postgres_especialidades: Session,
) -> None:
    session = banco_postgres_especialidades
    criar_especialidade(
        session,
        EspecialidadeCreate(nome="  Clínica   Médica  "),
    )

    with pytest.raises(IntegrityError):
        criar_especialidade(
            session,
            EspecialidadeCreate(nome="Clínica Médica"),
        )


def test_busca_por_id_e_nome_normalizado_exclui_proprio_registro(
    banco_postgres_especialidades: Session,
) -> None:
    session = banco_postgres_especialidades
    especialidade = criar_especialidade(
        session,
        EspecialidadeCreate(nome="Clínica Médica"),
    )

    por_id = buscar_especialidade_por_id(session, especialidade.id)
    por_nome = buscar_especialidade_por_nome_normalizado(session, "CLÍNICA MÉDICA")
    excluindo_proprio_id = buscar_especialidade_por_nome_normalizado(
        session,
        "clínica médica",
        especialidade_id_excluido=especialidade.id,
    )

    assert por_id is especialidade
    assert por_nome is especialidade
    assert excluindo_proprio_id is None


def test_atualiza_especialidade_e_executa_flush_no_postgres(
    banco_postgres_especialidades: Session,
) -> None:
    session = banco_postgres_especialidades
    especialidade = criar_especialidade(
        session,
        EspecialidadeCreate(nome="Cardiologia"),
    )
    especialidade_id = especialidade.id

    resultado = atualizar_especialidade(
        session,
        especialidade,
        EspecialidadeUpdate(nome="Cardiologia Pediátrica"),
    )
    session.expunge_all()

    assert resultado.id == especialidade_id
    assert buscar_especialidade_por_id(session, especialidade_id).nome == (
        "Cardiologia Pediátrica"
    )
