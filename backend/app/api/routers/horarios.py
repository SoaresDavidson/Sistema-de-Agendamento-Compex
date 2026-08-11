import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.horario import Horario
from app.schemas.horario import HorarioResponse
from app.services.horario import (
    HorarioJaInativoError,
    HorarioNaoEncontradoError,
    desativar_horario,
)

router = APIRouter(prefix="/api/horarios", tags=["horarios"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.patch(
    "/{horario_id}/desativar",
    response_model=HorarioResponse,
    status_code=status.HTTP_200_OK,
)
def desativar(horario_id: uuid.UUID, session: SessionDep) -> Horario:
    try:
        horario = desativar_horario(session, horario_id)
    except HorarioNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horário não encontrado",
        ) from None
    except HorarioJaInativoError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Horário já está inativo",
        ) from None
    session.commit()
    return horario
