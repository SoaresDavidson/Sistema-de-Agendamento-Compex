import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HorarioBase(BaseModel):
    medico_id: uuid.UUID
    inicio: datetime
    fim: datetime


class HorarioCreate(HorarioBase):
    pass


class HorarioResponse(HorarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ativo: bool
