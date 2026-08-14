import os
import uuid
from collections.abc import Generator
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, insert, inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cliente import Client
from app.repositories.clientes import (
    apagar_cliente,
    buscar_cliente_por_id,
    buscar_possivel_duplicidade,
    criar_cliente,
    listar_clientes,
)
from app.schemas.clientes import ClienteCreate, ClienteUpdate
from app.services.cliente import (
    ClienteDuplicado,
    atualizar_cliente_service,
    criar_cliente_service,
)
from main import app

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
            connection.exec_driver_sql(f'SET LOCAL search_path TO "{schema}"')
            Client.__table__.create(connection)
            connection.exec_driver_sql(
                """
                CREATE TABLE agendamentos (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    cliente_id UUID NOT NULL REFERENCES clientes(id),
                    horario_id UUID NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'AGENDADO',
                    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
                    cancelado_por VARCHAR,
                    cancelado_em TIMESTAMPTZ,
                    observacao_cancelamento VARCHAR(1000)
                )
                """
            )

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


@pytest.fixture
def api_clientes_postgres(
    banco_postgres_clientes: Session,
) -> Generator[TestClient]:
    app.dependency_overrides[get_db] = lambda: banco_postgres_clientes
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


def criar_payload(
    *,
    email: str | None = None,
    nome: str = "Ana Silva",
    data_nascimento: date = date(1990, 5, 10),
    confirmar_duplicidade: bool = False,
) -> ClienteCreate:
    return ClienteCreate(
        nome=nome,
        telefone="85999999999",
        email=email,
        data_nascimento=data_nascimento,
        confirmar_duplicidade=confirmar_duplicidade,
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


def test_service_exige_confirmacao_antes_de_persistir_duplicidade(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    primeiro = criar_cliente_service(session, criar_payload())
    session.flush()

    with pytest.raises(ClienteDuplicado):
        criar_cliente_service(session, criar_payload())

    quantidade_antes = session.scalar(select(func.count()).select_from(Client))
    segundo = criar_cliente_service(
        session,
        criar_payload(confirmar_duplicidade=True),
    )
    session.flush()
    quantidade_depois = session.scalar(select(func.count()).select_from(Client))

    assert quantidade_antes == 1
    assert quantidade_depois == 2
    assert segundo.id != primeiro.id


def test_duplicidade_ignora_caixa_e_normaliza_espacos_do_nome(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    criar_cliente(session, criar_payload(nome="Ana Silva"))

    duplicidade = buscar_possivel_duplicidade(
        session,
        criar_payload(nome="  ANA   SILVA  "),
    )

    assert duplicidade is not None


def test_mesmo_nome_com_data_diferente_nao_e_duplicidade(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    criar_cliente(session, criar_payload())

    duplicidade = buscar_possivel_duplicidade(
        session,
        criar_payload(data_nascimento=date(1991, 5, 10)),
    )

    assert duplicidade is None


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
    hoje_banco = banco_postgres_clientes.scalar(select(func.current_date()))
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
    indices = inspect(banco_postgres_clientes.connection()).get_indexes("clientes")
    indice = next(
        indice
        for indice in indices
        if indice["name"] == "ix_clientes_nome_data_nascimento"
    )

    assert indice["column_names"] == ["nome", "data_nascimento"]
    assert indice["unique"] is False


def test_atualiza_parcialmente_e_exclui_proprio_id_da_duplicidade_no_postgres(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    cliente = criar_cliente(session, criar_payload(email="ana@example.com"))

    atualizado = atualizar_cliente_service(
        session,
        cliente.id,
        ClienteUpdate(nome="  ANA   SILVA  ", email="novo@example.com"),
    )
    session.flush()
    session.expunge_all()
    persistido = buscar_cliente_por_id(session, cliente.id)

    assert atualizado.id == cliente.id
    assert persistido is not None
    assert persistido.nome == "ANA SILVA"
    assert persistido.telefone == "85999999999"
    assert persistido.email == "novo@example.com"


def test_atualizacao_duplicada_exige_confirmacao_no_postgres(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    criar_cliente(session, criar_payload(nome="Ana Silva"))
    segundo = criar_cliente(
        session,
        criar_payload(nome="Beatriz Souza", email="beatriz@example.com"),
    )

    with pytest.raises(ClienteDuplicado):
        atualizar_cliente_service(
            session,
            segundo.id,
            ClienteUpdate(nome="ANA SILVA"),
        )

    atualizado = atualizar_cliente_service(
        session,
        segundo.id,
        ClienteUpdate(nome="ANA SILVA", confirmar_duplicidade=True),
    )

    assert atualizado.nome == "ANA SILVA"


def test_repository_apaga_cliente_no_postgres(
    banco_postgres_clientes: Session,
) -> None:
    session = banco_postgres_clientes
    cliente = criar_cliente(session, criar_payload())
    cliente_id = cliente.id

    apagar_cliente(session, cliente)
    session.expunge_all()

    assert buscar_cliente_por_id(session, cliente_id) is None


def test_api_patch_aceita_data_nascimento_de_hoje_no_postgres(
    banco_postgres_clientes: Session,
    api_clientes_postgres: TestClient,
) -> None:
    session = banco_postgres_clientes
    hoje_banco = session.scalar(select(func.current_date()))
    assert hoje_banco is not None
    cliente = criar_cliente(session, criar_payload(email="ana@example.com"))
    cliente_id = cliente.id
    session.commit()

    resposta = api_clientes_postgres.patch(
        f"/api/clientes/{cliente_id}",
        json={"data_nascimento": hoje_banco.isoformat()},
    )

    assert resposta.status_code == 200
    assert resposta.json()["data_nascimento"] == hoje_banco.isoformat()
    session.expunge_all()
    cliente_atualizado = buscar_cliente_por_id(session, cliente_id)
    assert cliente_atualizado is not None
    assert cliente_atualizado.data_nascimento == hoje_banco


def test_api_delete_cliente_com_agendamento_retorna_409_e_preserva_sessao(
    banco_postgres_clientes: Session,
    api_clientes_postgres: TestClient,
) -> None:
    session = banco_postgres_clientes
    cliente = criar_cliente(session, criar_payload(email="ana@example.com"))
    cliente_id = cliente.id
    session.execute(
        text(
            """
            INSERT INTO agendamentos (cliente_id, horario_id)
            VALUES (:cliente_id, :horario_id)
            """
        ),
        {"cliente_id": cliente_id, "horario_id": uuid.uuid4()},
    )
    session.commit()
    rollbacks: list[None] = []
    event.listen(session, "after_rollback", lambda _session: rollbacks.append(None))

    resposta = api_clientes_postgres.delete(f"/api/clientes/{cliente_id}")

    assert resposta.status_code == 409
    assert resposta.json() == {
        "detail": {"mensagem": "Cliente possui agendamentos e não pode ser excluído"}
    }
    assert rollbacks == [None]
    session.expunge_all()
    assert buscar_cliente_por_id(session, cliente_id) is not None
    assert session.scalar(select(func.count()).select_from(Client)) == 1
