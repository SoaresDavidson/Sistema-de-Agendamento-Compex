import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agendamento import Agendamento
from app.schemas.agendamento import (
    AgendamentoCreate,
    AgendamentoPage,
    AgendamentoResponse,
    CancelamentoRequest,
    CancelamentoResponse,
)
from app.services.agendamento import (
    AgendamentoJaCanceladoError,
    AgendamentoNaoEncontradoError,
    ClienteNaoEncontradoError,
    HorarioIndisponivelError,
    HorarioNaoEncontradoParaAgendamentoError,
    aplicar_cancelamento,
    listar_agendamentos_service,
    realizar_agendamento,
    validar_cancelamento,
)

router = APIRouter(prefix="/agendamentos", tags=["agendamentos"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.get("", response_model=AgendamentoPage)
def listar(
    session: SessionDep,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 5,
    cliente: Annotated[str | None, Query()] = None,
    medico: Annotated[str | None, Query()] = None,
    especialidade: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
    data: Annotated[date | None, Query()] = None,
) -> AgendamentoPage:
    return listar_agendamentos_service(
        session,
        page,
        size,
        cliente=cliente,
        medico=medico,
        especialidade=especialidade,
        status=status,
        data=data,
    )


@router.post(
    "",
    response_model=AgendamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar(dados: AgendamentoCreate, session: SessionDep) -> Agendamento:
    try:
        agendamento = realizar_agendamento(session, dados)
        session.commit()
        return agendamento
    except ClienteNaoEncontradoError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado",
        ) from None
    except HorarioNaoEncontradoParaAgendamentoError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horário não encontrado",
        ) from None
    except HorarioIndisponivelError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Horário não está mais disponível",
        ) from None
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Horário não está mais disponível",
        ) from None
    except Exception:
        session.rollback()
        raise


@router.patch(
    "/{agendamento_id}/cancelar",
    response_model=CancelamentoResponse,
    status_code=status.HTTP_200_OK,
)
def cancelar(
    agendamento_id: uuid.UUID,
    dados: CancelamentoRequest,
    session: SessionDep,
) -> Agendamento:
    try:
        agendamento = validar_cancelamento(session, agendamento_id)
        agendamento = aplicar_cancelamento(
            session, agendamento, dados.origem, dados.observacao
        )
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

    session.commit()
    return agendamento
