import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.routers.api_errors import reverter_transacao_e_lancar_erro_http
from app.database import get_db
from app.schemas.especialidade import (
    EspecialidadeCreate,
    EspecialidadePage,
    EspecialidadeResponse,
)
from app.services.especialidade import (
    EspecialidadeDuplicada,
    criar_especialidade_service,
    listar_especialidades_service,
)

router = APIRouter(prefix="/especialidades", tags=["especialidades"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=EspecialidadeResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_especialidade(
    session: SessionDep,
    payload: EspecialidadeCreate,
) -> EspecialidadeResponse:
    try:
        especialidade = criar_especialidade_service(session, payload)
        session.commit()
        return especialidade
    except EspecialidadeDuplicada as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_409_CONFLICT,
            erro,
        )
    except IntegrityError:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_409_CONFLICT,
            Exception("Especialidade já cadastrada."),
        )


@router.get("", response_model=EspecialidadePage)
def listar_especialidades(
    session: SessionDep,
    cursor: Annotated[uuid.UUID | None, Query()] = None,
    limite: Annotated[int, Query(ge=1, le=100)] = 20,
) -> EspecialidadePage:
    return listar_especialidades_service(session, cursor, limite)
