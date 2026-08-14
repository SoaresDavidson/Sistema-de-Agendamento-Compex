import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.repositories.clientes import (
    apagar_cliente,
    atualizar_cliente,
    buscar_cliente_por_id,
    buscar_possivel_duplicidade,
    cliente_possui_agendamentos,
    criar_cliente,
    listar_clientes,
)
from app.schemas.clientes import ClienteCreate, ClientePage, ClienteUpdate


class ClienteDuplicado(Exception):
    """Indica que já existe um cliente com esses dados"""


class ClienteNaoNasceu(Exception):
    """Tentativa de cadastrar o cliente com uma data de nascimento futura"""


class ClienteSemNome(Exception):
    """Tentativa de cadastro de cliente sem nome"""


class ClienteSemTelefone(Exception):
    """Tentativa de cadastro de cliente sem telefone"""


class ClienteSemDataNascimento(Exception):
    """Tentativa de cadastro de cliente sem Data de Nascimento"""


class ClienteNaoEncontrado(LookupError):
    """Indica que o cliente informado não existe"""


class ClientePossuiAgendamentos(Exception):
    """Indica que cliente com agendamentos não pode ser excluído."""


def criar_cliente_service(session: Session, dados: ClienteCreate) -> Client:
    """Na modelagem de dados só é citado caso de cliente duplicado quando nome e data de nascimento são iguas, apesar de fazer sentido bloquear cliente com email ou telefone igual optei por não implementar."""
    if buscar_possivel_duplicidade(session, dados) and not dados.confirmar_duplicidade:
        raise ClienteDuplicado(
            "Já existe um cliente com o mesmo nome e data de nascimento"
        )

    if dados.data_nascimento >= datetime.now(UTC).date():
        raise ClienteNaoNasceu("Data de nascimento deve ser anterior à data atual")

    if dados.nome is None:
        raise ClienteSemNome()
    if dados.telefone is None:
        raise ClienteSemTelefone()
    if dados.data_nascimento is None:
        raise ClienteSemDataNascimento()

    return criar_cliente(session, dados)


def listar_clientes_service(
    session: Session,
    cursor_id: uuid.UUID | None,
    limite: int,
) -> ClientePage:
    clientes, proximo_id = listar_clientes(session, cursor_id, limite)
    return ClientePage(
        items=list(clientes),
        next_cursor=str(proximo_id) if proximo_id is not None else None,
    )


def atualizar_cliente_service(
    session: Session,
    cliente_id: uuid.UUID,
    dados: ClienteUpdate,
) -> Client:
    cliente = buscar_cliente_por_id(session, cliente_id)
    if cliente is None:
        raise ClienteNaoEncontrado("Cliente não encontrado")

    if (
        dados.data_nascimento is not None
        and dados.data_nascimento > datetime.now(UTC).date()
    ):
        raise ClienteNaoNasceu("Data de nascimento não pode ser futura")

    if {"nome", "data_nascimento"} & dados.model_fields_set:
        dados_duplicidade = dados.model_copy(
            update={
                "nome": dados.nome if dados.nome is not None else cliente.nome,
                "data_nascimento": (
                    dados.data_nascimento
                    if dados.data_nascimento is not None
                    else cliente.data_nascimento
                ),
            }
        )
        if (
            buscar_possivel_duplicidade(
                session,
                dados_duplicidade,
                cliente_id_excluido=cliente.id,
            )
            and not dados.confirmar_duplicidade
        ):
            raise ClienteDuplicado(
                "Já existe um cliente com o mesmo nome e data de nascimento"
            )

    return atualizar_cliente(session, cliente, dados)


def apagar_cliente_service(session: Session, cliente_id: uuid.UUID) -> None:
    cliente = buscar_cliente_por_id(session, cliente_id)
    if cliente is None:
        raise ClienteNaoEncontrado("Cliente não encontrado")
    if cliente_possui_agendamentos(session, cliente_id):
        raise ClientePossuiAgendamentos(
            "Cliente possui agendamentos e não pode ser excluído"
        )
    apagar_cliente(session, cliente)
