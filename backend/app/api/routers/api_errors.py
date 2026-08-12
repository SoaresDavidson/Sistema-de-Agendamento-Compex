from typing import NoReturn

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

def reverter_transacao_e_lancar_erro_http(
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
