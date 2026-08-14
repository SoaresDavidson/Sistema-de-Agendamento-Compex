import uuid
from datetime import date
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.schemas.clientes import ClienteCreate, ClienteUpdate
from app.services import cliente as cliente_service
from app.services.cliente import (
    ClienteDuplicado,
    ClienteNaoEncontrado,
    apagar_cliente_service,
    atualizar_cliente_service,
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


def test_atualizar_cliente_parcial_usa_cliente_encontrado(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente = criar_modelo()
    payload = ClienteUpdate(telefone="85988888888")
    buscar_por_id = MagicMock(return_value=cliente)
    buscar_duplicidade = MagicMock()
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(cliente_service, "buscar_cliente_por_id", buscar_por_id)
    monkeypatch.setattr(
        cliente_service,
        "buscar_possivel_duplicidade",
        buscar_duplicidade,
    )
    monkeypatch.setattr(cliente_service, "atualizar_cliente", atualizar)

    resultado = atualizar_cliente_service(session, cliente.id, payload)

    assert resultado is cliente
    buscar_por_id.assert_called_once_with(session, cliente.id)
    buscar_duplicidade.assert_not_called()
    atualizar.assert_called_once_with(session, cliente, payload)


def test_atualizar_cliente_inexistente_interrompe_operacao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente_id = uuid.uuid4()
    atualizar = MagicMock()
    monkeypatch.setattr(
        cliente_service, "buscar_cliente_por_id", MagicMock(return_value=None)
    )
    monkeypatch.setattr(cliente_service, "atualizar_cliente", atualizar)

    with pytest.raises(ClienteNaoEncontrado, match="Cliente não encontrado"):
        atualizar_cliente_service(
            session,
            cliente_id,
            ClienteUpdate(nome="Ana Maria"),
        )

    atualizar.assert_not_called()


def test_atualizar_cliente_exclui_proprio_id_da_checagem_de_duplicidade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente = criar_modelo()
    payload = ClienteUpdate(nome=cliente.nome)
    buscar_duplicidade = MagicMock(return_value=None)
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(
        cliente_service,
        "buscar_cliente_por_id",
        MagicMock(return_value=cliente),
    )
    monkeypatch.setattr(
        cliente_service,
        "buscar_possivel_duplicidade",
        buscar_duplicidade,
    )
    monkeypatch.setattr(cliente_service, "atualizar_cliente", atualizar)

    atualizar_cliente_service(session, cliente.id, payload)

    dados_duplicidade = buscar_duplicidade.call_args.args[1]
    assert dados_duplicidade.nome == cliente.nome
    assert dados_duplicidade.data_nascimento == cliente.data_nascimento
    buscar_duplicidade.assert_called_once_with(
        session,
        dados_duplicidade,
        cliente_id_excluido=cliente.id,
    )
    atualizar.assert_called_once_with(session, cliente, payload)


def test_atualizar_cliente_rejeita_duplicidade_sem_confirmacao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente = criar_modelo()
    atualizar = MagicMock()
    monkeypatch.setattr(
        cliente_service,
        "buscar_cliente_por_id",
        MagicMock(return_value=cliente),
    )
    monkeypatch.setattr(
        cliente_service,
        "buscar_possivel_duplicidade",
        MagicMock(return_value=criar_modelo()),
    )
    monkeypatch.setattr(cliente_service, "atualizar_cliente", atualizar)

    with pytest.raises(ClienteDuplicado, match="mesmo nome"):
        atualizar_cliente_service(
            session,
            cliente.id,
            ClienteUpdate(nome="Outra Ana"),
        )

    atualizar.assert_not_called()


def test_atualizar_cliente_confirmado_aceita_duplicidade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente = criar_modelo()
    payload = ClienteUpdate(nome="Outra Ana", confirmar_duplicidade=True)
    atualizar = MagicMock(return_value=cliente)
    monkeypatch.setattr(
        cliente_service,
        "buscar_cliente_por_id",
        MagicMock(return_value=cliente),
    )
    monkeypatch.setattr(
        cliente_service,
        "buscar_possivel_duplicidade",
        MagicMock(return_value=criar_modelo()),
    )
    monkeypatch.setattr(cliente_service, "atualizar_cliente", atualizar)

    resultado = atualizar_cliente_service(session, cliente.id, payload)

    assert resultado is cliente
    atualizar.assert_called_once_with(session, cliente, payload)


def test_apagar_cliente_usa_cliente_encontrado(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente = criar_modelo()
    apagar = MagicMock()
    monkeypatch.setattr(
        cliente_service,
        "buscar_cliente_por_id",
        MagicMock(return_value=cliente),
    )
    monkeypatch.setattr(cliente_service, "apagar_cliente", apagar)

    apagar_cliente_service(session, cliente.id)

    apagar.assert_called_once_with(session, cliente)


def test_apagar_cliente_inexistente_interrompe_operacao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cliente_id = uuid.uuid4()
    apagar = MagicMock()
    monkeypatch.setattr(
        cliente_service, "buscar_cliente_por_id", MagicMock(return_value=None)
    )
    monkeypatch.setattr(cliente_service, "apagar_cliente", apagar)

    with pytest.raises(ClienteNaoEncontrado, match="Cliente não encontrado"):
        apagar_cliente_service(session, cliente_id)

    apagar.assert_not_called()
