import uuid
from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.clientes import (
    ClienteCreate,
    ClientePage,
    ClienteResponse,
)


def payload_valido() -> dict[str, object]:
    return {
        "nome": "Ana Silva",
        "telefone": "85999999999",
        "email": "ana@example.com",
        "data_nascimento": date(1990, 5, 10),
    }


def test_cria_cliente_com_dados_validos() -> None:
    cliente = ClienteCreate.model_validate(payload_valido())

    assert cliente.nome == "Ana Silva"
    assert cliente.telefone == "85999999999"
    assert cliente.email == "ana@example.com"
    assert cliente.data_nascimento == date(1990, 5, 10)
    assert cliente.confirmar_duplicidade is False


def test_email_e_opcional() -> None:
    payload = payload_valido()
    del payload["email"]

    cliente = ClienteCreate.model_validate(payload)

    assert cliente.email is None


@pytest.mark.parametrize("email", [None, "", "   "])
def test_aceita_email_vazio(email: object) -> None:
    payload = payload_valido()
    payload["email"] = email

    cliente = ClienteCreate.model_validate(payload)

    assert cliente.email is None


def test_remove_espacos_externos_do_nome() -> None:
    payload = payload_valido()
    payload["nome"] = "  Ana Silva  "

    cliente = ClienteCreate.model_validate(payload)

    assert cliente.nome == "Ana Silva"


def test_normaliza_espacos_internos_do_nome() -> None:
    payload = payload_valido()
    payload["nome"] = "  Ana   Maria  Silva  "

    cliente = ClienteCreate.model_validate(payload)

    assert cliente.nome == "Ana Maria Silva"


@pytest.mark.parametrize("nome", ["", "   ", "a" * 256])
def test_rejeita_nome_invalido(nome: str) -> None:
    payload = payload_valido()
    payload["nome"] = nome

    with pytest.raises(ValidationError):
        ClienteCreate.model_validate(payload)


@pytest.mark.parametrize("telefone", ["", "   "])
def test_rejeita_telefone_vazio(telefone: str) -> None:
    payload = payload_valido()
    payload["telefone"] = telefone

    with pytest.raises(ValidationError):
        ClienteCreate.model_validate(payload)


@pytest.mark.parametrize("data_nascimento", [None, "", "   "])
def test_rejeita_data_nascimento_vazia(data_nascimento: object) -> None:
    payload = payload_valido()
    payload["data_nascimento"] = data_nascimento

    with pytest.raises(ValidationError):
        ClienteCreate.model_validate(payload)


def test_rejeita_email_invalido() -> None:
    payload = payload_valido()
    payload["email"] = "email-invalido"

    with pytest.raises(ValidationError):
        ClienteCreate.model_validate(payload)


@pytest.mark.parametrize("campo", ["nome", "telefone", "data_nascimento"])
def test_rejeita_campo_obrigatorio_ausente(campo: str) -> None:
    payload = payload_valido()
    del payload[campo]

    with pytest.raises(ValidationError):
        ClienteCreate.model_validate(payload)


def test_rejeita_data_nascimento_futura() -> None:
    payload = payload_valido()
    payload["data_nascimento"] = datetime.now(UTC).date() + timedelta(days=1)

    with pytest.raises(
        ValidationError,
        match="data de nascimento não pode ser futura",
    ):
        ClienteCreate.model_validate(payload)


def test_cliente_response_le_atributos_do_model() -> None:
    cliente_id = uuid.uuid4()
    model = SimpleNamespace(id=cliente_id, **payload_valido())

    response = ClienteResponse.model_validate(model)

    assert response.id == cliente_id
    assert response.nome == "Ana Silva"


def test_cliente_page_aceita_itens_e_cursor() -> None:
    cliente = ClienteResponse.model_validate({"id": uuid.uuid4(), **payload_valido()})

    pagina = ClientePage(items=[cliente], next_cursor="cursor-seguinte")

    assert pagina.items == [cliente]
    assert pagina.next_cursor == "cursor-seguinte"
