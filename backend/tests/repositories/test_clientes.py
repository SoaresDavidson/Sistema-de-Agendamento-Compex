import uuid
from datetime import date
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.repositories.clientes import (
    buscar_cliente_por_id,
    buscar_possivel_duplicidade,
    criar_cliente,
    listar_clientes,
)
from app.schemas.clientes import ClienteCreate


def criar_payload_valido() -> ClienteCreate:
    return ClienteCreate(
        nome="Ana Silva",
        telefone="85999999999",
        email="ana@example.com",
        data_nascimento=date(1990, 5, 10),
    )


def criar_modelo_cliente() -> Client:
    return Client(
        id=uuid.uuid4(),
        nome="Ana Silva",
        telefone="85999999999",
        email="ana@example.com",
        data_nascimento=date(1990, 5, 10),
    )


def test_criar_cliente_adiciona_e_executa_flush() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido()

    cliente = criar_cliente(session, payload)

    assert isinstance(cliente, Client)
    assert cliente.nome == payload.nome
    assert cliente.telefone == payload.telefone
    assert cliente.email == payload.email
    assert cliente.data_nascimento == payload.data_nascimento
    session.add.assert_called_once_with(cliente)
    session.flush.assert_called_once_with()
    session.commit.assert_not_called()


def test_criar_cliente_nao_persiste_confirmacao_de_duplicidade() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido().model_copy(update={"confirmar_duplicidade": True})

    cliente = criar_cliente(session, payload)

    assert "confirmar_duplicidade" not in cliente.__dict__


@pytest.mark.parametrize("encontrado", [True, False])
def test_buscar_cliente_por_id_utiliza_chave_primaria(encontrado: bool) -> None:
    session = MagicMock(spec=Session)
    cliente_id = uuid.uuid4()
    cliente_esperado = criar_modelo_cliente() if encontrado else None
    session.get.return_value = cliente_esperado

    cliente = buscar_cliente_por_id(session, cliente_id)

    assert cliente is cliente_esperado
    session.get.assert_called_once_with(Client, cliente_id)


@pytest.mark.parametrize("encontrado", [True, False])
def test_buscar_possivel_duplicidade_por_nome_e_nascimento(
    encontrado: bool,
) -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido()
    cliente_esperado = criar_modelo_cliente() if encontrado else None
    session.scalar.return_value = cliente_esperado

    cliente = buscar_possivel_duplicidade(session, payload)

    assert cliente is cliente_esperado
    statement = session.scalar.call_args.args[0]
    parametros = statement.compile().params.values()
    assert payload.nome.lower() in parametros
    assert payload.data_nascimento in parametros


def test_listar_clientes_sem_proxima_pagina() -> None:
    session = MagicMock(spec=Session)
    clientes_esperados = [criar_modelo_cliente(), criar_modelo_cliente()]
    session.scalars.return_value.all.return_value = clientes_esperados

    clientes, proximo_id = listar_clientes(session, limit=2)

    assert clientes == clientes_esperados
    assert proximo_id is None
    session.scalars.assert_called_once()


def test_listar_clientes_remove_excedente_e_retorna_cursor() -> None:
    session = MagicMock(spec=Session)
    clientes_retornados = [
        criar_modelo_cliente(),
        criar_modelo_cliente(),
        criar_modelo_cliente(),
    ]
    session.scalars.return_value.all.return_value = clientes_retornados

    clientes, proximo_id = listar_clientes(session, limit=2)

    assert clientes == clientes_retornados[:2]
    assert proximo_id == clientes_retornados[1].id


def test_listar_clientes_aplica_cursor_na_consulta() -> None:
    session = MagicMock(spec=Session)
    cursor_id = uuid.uuid4()
    session.scalars.return_value.all.return_value = []

    clientes, proximo_id = listar_clientes(
        session,
        cursor_id=cursor_id,
    )

    assert clientes == []
    assert proximo_id is None
    statement = session.scalars.call_args.args[0]
    assert cursor_id in statement.compile().params.values()


@pytest.mark.parametrize(
    ("limit", "limite_sql"),
    [(0, 2), (101, 101)],
)
def test_listar_clientes_limita_tamanho_da_pagina(
    limit: int,
    limite_sql: int,
) -> None:
    session = MagicMock(spec=Session)
    session.scalars.return_value.all.return_value = []

    listar_clientes(session, limit=limit)

    statement = session.scalars.call_args.args[0]
    sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert f"LIMIT {limite_sql}" in sql
