import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.routers.api_errors import reverter_transacao_e_lancar_erro_http
from app.database import get_db
from app.schemas.clientes import ClienteCreate, ClientePage, ClienteResponse
from app.services.cliente import (
    ClienteDuplicado,
    ClienteNaoNasceu,
    criar_cliente_service,
    listar_clientes_service,
)

router = APIRouter(prefix="/clientes", tags=["clientes"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_cliente(
    session: SessionDep,
    dados: ClienteCreate,
) -> ClienteResponse:
    try:
        cliente = criar_cliente_service(session, dados)
    except ClienteDuplicado as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_409_CONFLICT,
            erro,
            {"requer_confirmacao": True},
        )
    except ClienteNaoNasceu as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )

    session.commit()
    return cliente


@router.get("", response_model=ClientePage)
def listar_clientes(
    session: SessionDep,
    cursor: Annotated[uuid.UUID | None, Query()] = None,
    limite: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ClientePage:
    return listar_clientes_service(session, cursor, limite)
