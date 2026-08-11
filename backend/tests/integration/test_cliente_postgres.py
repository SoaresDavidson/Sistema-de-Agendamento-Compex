import os
import uuid
from collections.abc import Generator
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine, inspect, insert, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.repositories.clientes import (
    buscar_cliente_por_id,
    buscar_possivel_duplicidade,
    criar_cliente,
    listar_clientes,
)
from app.schemas.clientes import ClienteCreate

pytestmark = pytest.mark.integration


@pytest.fixture
def banco_postgres_clientes() -> Generator[Session]:
    database_url = os.getenv("DATABASE_URL")
    if database_url is None:
        pytest.skip("DATABASE_URL não configurada para o teste de integração")

    engine = create_engine(database_url)

    with engine.connect() as connection:
        transaction = connection.begin()
        schema = f"test_clientes_{uuid.uuid4().hex}"

        try:
            connection.exec_driver_sql(f'CREATE SCHEMA "{schema}"')
            connection.exec_driver_sql(
                f'SET LOCAL search_path TO "{schema}"'
            )
            Client.__table__.create(connection)

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


def criar_payload(
    *,
    email: str | None = None,
) -> ClienteCreate:
    return ClienteCreate(
        nome="Ana Silva",
        telefone="85999999999",
        email=email,
        data_nascimento=date(1990, 5, 10),
    )


def test_cria_busca_e_lista_cliente_no_postgres(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    cliente_criado = criar_cliente(
        session,
        criar_payload(email="ana@example.com"),
    )
    cliente_id = cliente_criado.id
    session.expunge_all()

    cliente_encontrado = buscar_cliente_por_id(session, cliente_id)
    clientes, proximo_id = listar_clientes(session)

    assert cliente_encontrado is not None
    assert cliente_encontrado.id == cliente_id
    assert cliente_encontrado.nome == "Ana Silva"
    assert cliente_encontrado.email == "ana@example.com"
    assert [cliente.id for cliente in clientes] == [cliente_id]
    assert proximo_id is None


def test_email_opcional_e_duplicidade_nao_impede_cadastro(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    primeiro = criar_cliente(session, criar_payload())
    segundo = criar_cliente(session, criar_payload())

    duplicidade = buscar_possivel_duplicidade(session, criar_payload())

    assert primeiro.id != segundo.id
    assert primeiro.email is None
    assert segundo.email is None
    assert duplicidade is not None
    assert duplicidade.id in {primeiro.id, segundo.id}


@pytest.mark.parametrize("campo", ["nome", "telefone", "data_nascimento"])
def test_banco_rejeita_campo_obrigatorio_ausente(
    banco_postgres_clientes: Session,
    campo: str,
) -> None:
    valores = {
        "nome": "Ana Silva",
        "telefone": "85999999999",
        "email": None,
        "data_nascimento": date(1990, 5, 10),
    }
    del valores[campo]

    with pytest.raises(IntegrityError):
        banco_postgres_clientes.execute(insert(Client).values(**valores))



def test_banco_rejeita_data_nascimento_futura(
    banco_postgres_clientes: Session,
) -> None:
    hoje_banco = banco_postgres_clientes.scalar(
    select(func.current_date())
    )
    assert hoje_banco is not None

    data_futura = hoje_banco + timedelta(days=1)
    with pytest.raises(IntegrityError):
        banco_postgres_clientes.execute(
            insert(Client).values(
                nome="Ana Silva",
                telefone="85999999999",
                email=None,
                data_nascimento=data_futura,
            )
        )


def test_banco_possui_indice_nao_unico_para_duplicidade(
    banco_postgres_clientes: Session,
) -> None:
    indices = inspect(banco_postgres_clientes.connection()).get_indexes(
        "clientes"
    )
    indice = next(
        indice
        for indice in indices
        if indice["name"] == "ix_clientes_nome_data_nascimento"
    )

    assert indice["column_names"] == ["nome", "data_nascimento"]
    assert indice["unique"] is False
