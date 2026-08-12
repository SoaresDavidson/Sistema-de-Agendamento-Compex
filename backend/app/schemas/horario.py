import uuid
from datetime import date, datetime, time
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class DiaSemana(StrEnum):
    SEGUNDA = "SEGUNDA"
    TERCA = "TERCA"
    QUARTA = "QUARTA"
    QUINTA = "QUINTA"
    SEXTA = "SEXTA"
    SABADO = "SABADO"
    DOMINGO = "DOMINGO"


class HorarioBase(BaseModel):
    medico_id: uuid.UUID
    inicio: datetime
    fim: datetime


class HorarioCreate(HorarioBase):
    pass


class HorarioLoteCreate(BaseModel):
    medico_id: uuid.UUID
    data_inicio: date
    data_fim: date
    dias_semana: set[DiaSemana] = Field(min_length=1)
    inicio_periodo: time
    fim_periodo: time
    duracao_minutos: int = Field(gt=0)


class HorarioResponse(HorarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ativo: bool


class HorarioDisponivelFiltros(BaseModel):
    data: date | None = None
    medico_id: uuid.UUID | None = None
    especialidade_id: uuid.UUID | None = None


class MedicoHorarioDisponivelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nome: str


class HorarioDisponivelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    inicio: datetime
    fim: datetime
    medico: MedicoHorarioDisponivelResponse


class HorariosLoteResponse(BaseModel):
    horarios: list[HorarioResponse]
    total_criados: int
