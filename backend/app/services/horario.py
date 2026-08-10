from collections.abc import Sequence
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.horario import Horario
from app.repositories.horario import buscar_horarios_sobrepostos, criar_horario
from app.schemas.horario import HorarioCreate


class IntervaloHorarioInvalidoError(ValueError):
    """Indica que o início não é anterior ao fim."""


class HorarioNoPassadoError(ValueError):
    """Indica tentativa de cadastrar um horário que já começou."""


class HorarioConflitanteError(Exception):
    def __init__(self, conflitos: Sequence[Horario]) -> None:
        self.conflitos = tuple(conflitos)
        super().__init__("Existem horários sobrepostos para este médico")


def cadastrar_horario_individual(
    session: Session,
    dados: HorarioCreate,
    agora: datetime | None = None,
) -> Horario:
    if dados.inicio >= dados.fim:
        raise IntervaloHorarioInvalidoError("inicio deve ser anterior a fim")

    referencia = agora or datetime.now(dados.inicio.tzinfo)
    if dados.inicio <= referencia:
        raise HorarioNoPassadoError("não é permitido cadastrar horário no passado")

    conflitos = buscar_horarios_sobrepostos(
        session,
        dados.medico_id,
        dados.inicio,
        dados.fim,
    )
    if conflitos:
        raise HorarioConflitanteError(conflitos)

    return criar_horario(session, dados)
