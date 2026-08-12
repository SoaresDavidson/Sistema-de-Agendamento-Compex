import uuid
from datetime import date
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.schemas.clientes import ClienteCreate
from app.services import cliente as cliente_service
from app.services.cliente import (
    ClienteDuplicado,
    criar_cliente_service,
    listar_clientes_service,
)


def criar_payload() -> ClienteCreate:
    return ClienteCreate(
        nome="Ana Silva",
        telefone="85999999999",
        email="ana@example.com",
        data_nascimento=date(1990, 5, 10),
    )


def criar_modelo() -> Client:
    return Client(
        id=uuid.uuid4(),
        **criar_payload().model_dump(exclude={"confirmar_duplicidade"}),
    )


def test_criar_cliente_usa_sessao_recebida(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload()
    cliente = criar_modelo()
    buscar = MagicMock(return_value=None)
    criar = MagicMock(return_value=cliente)
    monkeypatch.setattr(cliente_service, "buscar_possivel_duplicidade", buscar)
    monkeypatch.setattr(cliente_service, "criar_cliente", criar)

    resultado = criar_cliente_service(session, payload)

    assert resultado is cliente
    buscar.assert_called_once_with(session, payload)
    criar.assert_called_once_with(session, payload)


def test_criar_cliente_rejeita_possivel_duplicidade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload()
    monkeypatch.setattr(
        cliente_service,
        "buscar_possivel_duplicidade",
        MagicMock(return_value=criar_modelo()),
    )

    with pytest.raises(ClienteDuplicado, match="mesmo nome"):
        criar_cliente_service(session, payload)


def test_criar_cliente_confirmado_aceita_possivel_duplicidade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload().model_copy(update={"confirmar_duplicidade": True})
    cliente = criar_modelo()
    buscar = MagicMock(return_value=criar_modelo())
    criar = MagicMock(return_value=cliente)
    monkeypatch.setattr(cliente_service, "buscar_possivel_duplicidade", buscar)
    monkeypatch.setattr(cliente_service, "criar_cliente", criar)

    resultado = criar_cliente_service(session, payload)

    assert resultado is cliente
    buscar.assert_called_once_with(session, payload)
    criar.assert_called_once_with(session, payload)


def test_listar_clientes_retorna_pagina_com_cursor_serializado(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cursor = uuid.uuid4()
    proximo_cursor = uuid.uuid4()
    clientes = [criar_modelo(), criar_modelo()]
    listar = MagicMock(return_value=(clientes, proximo_cursor))
    monkeypatch.setattr(cliente_service, "listar_clientes", listar)

    pagina = listar_clientes_service(session, cursor, 2)

    assert [item.id for item in pagina.items] == [cliente.id for cliente in clientes]
    assert pagina.next_cursor == str(proximo_cursor)
    listar.assert_called_once_with(session, cursor, 2)
