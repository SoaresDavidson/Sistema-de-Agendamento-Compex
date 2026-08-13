import os
import uuid
from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, delete, func, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.models.medico import Medico
from app.models.medico_especialidade import tabela_medico_especialidade
from app.repositories.medico import criar_medico, listar_medico
from app.schemas.medico import MedicoCreate

pytestmark = pytest.mark.integration


@pytest.fixture
def banco_postgres_medicos() -> Generator[Session]:
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)
    with engine.connect() as connection:
        transaction = connection.begin()
        schema = f"test_medicos_{uuid.uuid4().hex}"

        try:
            connection.exec_driver_sql(f'CREATE SCHEMA "{schema}"')
            connection.exec_driver_sql(f'SET LOCAL search_path TO "{schema}"')
            Especialidade.__table__.create(connection)
            Medico.__table__.create(connection)
            tabela_medico_especialidade.create(connection)

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


def criar_especialidade(session: Session) -> Especialidade:
    especialidade = Especialidade(nome="Cardiologia")
    session.add(especialidade)
    session.flush()
    return especialidade


def test_cria_e_lista_medico_com_especialidade_no_postgres(
    banco_postgres_medicos: Session,
) -> None:
    session = banco_postgres_medicos
    especialidade = criar_especialidade(session)

    medico = criar_medico(
        session,
        MedicoCreate(
            nome="Dra. Mariana Alves",
            especialidades_id=[especialidade.id],
        ),
    )

    assert medico is not None
    medico_id = medico.id
    session.expunge_all()
    medicos, proximo_id = listar_medico(session)

    assert [item.id for item in medicos] == [medico_id]
    assert medicos[0].nome == "Dra. Mariana Alves"
    assert [item.id for item in medicos[0].especialidades] == [especialidade.id]
    assert proximo_id is None


def test_nao_cria_medico_quando_especialidade_nao_existe(
    banco_postgres_medicos: Session,
) -> None:
    session = banco_postgres_medicos

    medico = criar_medico(
        session,
        MedicoCreate(
            nome="Dra. Mariana Alves",
            especialidades_id=[uuid.uuid4()],
        ),
    )

    total_medicos = session.scalar(select(func.count()).select_from(Medico))
    total_associacoes = session.scalar(
        select(func.count()).select_from(tabela_medico_especialidade)
    )
    assert medico is None
    assert total_medicos == 0
    assert total_associacoes == 0


def test_banco_rejeita_associacao_com_especialidade_inexistente(
    banco_postgres_medicos: Session,
) -> None:
    session = banco_postgres_medicos
    medico = Medico(nome="Dra. Mariana Alves")
    session.add(medico)
    session.flush()

    with pytest.raises(IntegrityError):
        session.execute(
            insert(tabela_medico_especialidade).values(
                medico_id=medico.id,
                especialidade_id=uuid.uuid4(),
            )
        )


def test_banco_rejeita_associacao_duplicada(
    banco_postgres_medicos: Session,
) -> None:
    session = banco_postgres_medicos
    especialidade = criar_especialidade(session)
    medico = Medico(nome="Dra. Mariana Alves", especialidades=[especialidade])
    session.add(medico)
    session.flush()

    with pytest.raises(IntegrityError):
        session.execute(
            insert(tabela_medico_especialidade).values(
                medico_id=medico.id,
                especialidade_id=especialidade.id,
            )
        )


def test_banco_rejeita_medico_sem_nome(
    banco_postgres_medicos: Session,
) -> None:
    with pytest.raises(IntegrityError):
        banco_postgres_medicos.execute(insert(Medico).values())


@pytest.mark.parametrize("entidade", ["medico", "especialidade"])
def test_exclusao_remove_associacao_sem_remover_entidade_relacionada(
    banco_postgres_medicos: Session,
    entidade: str,
) -> None:
    session = banco_postgres_medicos
    especialidade = criar_especialidade(session)
    medico = Medico(nome="Dra. Mariana Alves", especialidades=[especialidade])
    session.add(medico)
    session.flush()

    if entidade == "medico":
        session.execute(delete(Medico).where(Medico.id == medico.id))
        classe_relacionada = Especialidade
        id_relacionado = especialidade.id
    else:
        session.execute(
            delete(Especialidade).where(Especialidade.id == especialidade.id)
        )
        classe_relacionada = Medico
        id_relacionado = medico.id

    total_associacoes = session.scalar(
        select(func.count()).select_from(tabela_medico_especialidade)
    )
    entidade_relacionada = session.get(classe_relacionada, id_relacionado)

    assert total_associacoes == 0
    assert entidade_relacionada is not None
