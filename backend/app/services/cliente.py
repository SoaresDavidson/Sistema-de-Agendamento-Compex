import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.cliente import Client
from app.repositories.clientes import (
    buscar_possivel_duplicidade,
    criar_cliente,
    listar_clientes,
)
from app.schemas.clientes import ClienteCreate, ClientePage


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


def criar_cliente_service(session: Session, dados: ClienteCreate) -> Client:
    """Na modelagem de dados só é citado caso de cliente duplicado quando nome e data de nascimento são iguas, apesar de fazer sentido bloquear cliente com email ou telefone igual optei por não implementar."""
    if buscar_possivel_duplicidade(session, dados):
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
