import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.agendamento import CancelamentoOrigem, StatusAgendamento


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


class CancelamentoRequest(BaseModel):
    origem: CancelamentoOrigem
    observacao: str | None = None


class CancelamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: StatusAgendamento
    cancelado_por: CancelamentoOrigem | None = None
    cancelado_em: datetime | None = None
    observacao_cancelamento: str | None = None
