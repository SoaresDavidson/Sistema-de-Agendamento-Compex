import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict

from app.models.agendamento import StatusAgendamento


class AgendamentoBase(BaseModel):
    cliente_id: uuid.UUID
    horario_id: uuid.UUID


class AgendamentoCreate(AgendamentoBase):
    pass


class AgendamentoResponse(AgendamentoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: StatusAgendamento
    criado_em: datetime


class CancelamentoOrigem(StrEnum):
    CLIENTE = "CLIENTE"
    MEDICO = "MEDICO"


class CancelamentoRequest(BaseModel):
    origem: CancelamentoOrigem
    observacao: str | None = None


class CancelamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: StatusAgendamento
