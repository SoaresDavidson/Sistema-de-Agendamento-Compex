
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.routers.api_errors import reverter_transacao_e_lancar_erro_http
from app.database import get_db
from app.schemas.medico import MedicoCreate, MedicoPage, MedicoResponse
from app.services.medico import (
    EspecialidadeInexistente,
    MedicoSemEspecialidade,
    cadastrar_medico_service,
    listar_medicos_service,
)

router = APIRouter(prefix="/medicos", tags=["medicos"])

SessionDep = Annotated[Session, Depends(get_db)]

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=MedicoResponse,
)
def cadastrar_medico(session: SessionDep, payload: MedicoCreate) -> MedicoResponse:
    try:
        medico = cadastrar_medico_service(session, payload)
        session.commit()
        return medico
    except MedicoSemEspecialidade as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )
    except EspecialidadeInexistente as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_404_NOT_FOUND,
            erro,
        )

@router.get("", response_model=MedicoPage)
def listar_medicos(
    session: SessionDep,
    cursor: Annotated[uuid.UUID | None, Query()] = None,
    limite: Annotated[int, Query(ge=1, le=100)] = 20,
    nome: Annotated[str | None, Query()] = None,
    especialidade_id: Annotated[uuid.UUID | None, Query()] = None,
) -> MedicoPage:
    return listar_medicos_service(
        session,
        cursor,
        limite,
        nome,
        especialidade_id,
    )
