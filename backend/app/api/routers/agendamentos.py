import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.agendamento import CancelamentoRequest, CancelamentoResponse
from app.services.agendamento import (
    AgendamentoJaCanceladoError,
    AgendamentoNaoEncontradoError,
    validar_cancelamento,
)

router = APIRouter(prefix="/agendamentos", tags=["agendamentos"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.patch(
    "/{agendamento_id}/cancelar",
    response_model=CancelamentoResponse,
    status_code=status.HTTP_200_OK,
)
def cancelar(
    agendamento_id: uuid.UUID,
    dados: CancelamentoRequest,
    session: SessionDep,
) -> dict:
    try:
        agendamento = validar_cancelamento(session, agendamento_id)
    except AgendamentoNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado",
        ) from None
    except AgendamentoJaCanceladoError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Agendamento já está cancelado",
        ) from None

    return agendamento
