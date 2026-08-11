from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.horario import (
    HorarioCreate,
    HorarioLoteCreate,
    HorarioResponse,
    HorariosLoteResponse,
)
from app.services.horario import (
    HorarioConflitanteError,
    HorarioNoPassadoError,
    HorariosLoteConflitantesError,
    IntervaloHorarioInvalidoError,
    cadastrar_horario_individual,
    cadastrar_horarios_em_lote,
)

router = APIRouter(prefix="/api/horarios", tags=["Horários"])
SessionDep = Annotated[Session, Depends(get_db)]


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
        _reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )
    except HorarioConflitanteError as erro:
        _reverter_transacao_e_lancar_erro_http(
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
        _reverter_transacao_e_lancar_erro_http(
            session,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            erro,
        )
    except HorariosLoteConflitantesError as erro:
        _reverter_transacao_e_lancar_erro_http(
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


def _reverter_transacao_e_lancar_erro_http(
    session: Session,
    status_code: int,
    erro: Exception,
    conflitos: dict[str, object] | None = None,
) -> NoReturn:
    session.rollback()
    detalhe: dict[str, object] = {"mensagem": str(erro)}
    if conflitos:
        detalhe.update(conflitos)

    raise HTTPException(
        status_code=status_code,
        detail=jsonable_encoder(detalhe),
    ) from erro
