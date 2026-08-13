import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routers.api_errors import reverter_transacao_e_lancar_erro_http
from app.database import get_db
from app.models.horario import Horario
from app.schemas.horario import (
    HorarioCreate,
    HorarioDisponivelFiltros,
    HorarioDisponivelResponse,
    HorarioLoteCreate,
    HorarioResponse,
    HorariosLoteResponse,
)
from app.services.horario import (
    HorarioComAgendamentoAtivoError,
    HorarioConflitanteError,
    HorarioJaInativoError,
    HorarioNaoEncontradoError,
    HorarioNoPassadoError,
    HorariosLoteConflitantesError,
    IntervaloHorarioInvalidoError,
    cadastrar_horario_individual,
    cadastrar_horarios_em_lote,
    consultar_horarios_disponiveis,
    desativar_horario,
)

router = APIRouter(prefix="/horarios", tags=["horarios"])

SessionDep = Annotated[Session, Depends(get_db)]
HorarioDisponivelFiltrosDep = Annotated[HorarioDisponivelFiltros, Depends()]


@router.get(
    "/disponiveis",
    response_model=list[HorarioDisponivelResponse],
    status_code=status.HTTP_200_OK,
)
def listar_horarios_disponiveis(
    filtros: HorarioDisponivelFiltrosDep,
    session: SessionDep,
) -> list[Horario]:
    return consultar_horarios_disponiveis(session, filtros)


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
    except HorarioComAgendamentoAtivoError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Horário possui agendamento ativo. Cancele o agendamento antes de desativar.",
        ) from None
    session.commit()
    return horario


@router.post(
    "",
    response_model=HorarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_horario(
    dados: HorarioCreate,
    session: SessionDep,
) -> HorarioResponse:
    try:
        horario = cadastrar_horario_individual(session, dados)
        session.commit()
        return HorarioResponse.model_validate(horario)
    except (IntervaloHorarioInvalidoError, HorarioNoPassadoError) as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )
    except HorarioConflitanteError as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_409_CONFLICT,
            erro,
            {"horarios_existentes": erro.conflitos},
        )
    except Exception:
        session.rollback()
        raise


@router.post(
    "/lote",
    response_model=HorariosLoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_horarios_em_lote(
    dados: HorarioLoteCreate,
    session: SessionDep,
) -> HorariosLoteResponse:
    try:
        horarios = cadastrar_horarios_em_lote(session, dados)
        session.commit()
        return HorariosLoteResponse(
            horarios=[HorarioResponse.model_validate(horario) for horario in horarios],
            total_criados=len(horarios),
        )
    except (IntervaloHorarioInvalidoError, HorarioNoPassadoError) as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )
    except HorariosLoteConflitantesError as erro:
        reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_409_CONFLICT,
            erro,
            {
                "horarios_existentes": erro.conflitos_existentes,
                "horarios_no_lote": erro.conflitos_no_lote,
            },
        )
    except Exception:
        session.rollback()
        raise
