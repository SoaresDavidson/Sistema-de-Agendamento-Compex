import uuid
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

NomeMedico = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=255,
    ),
]


class MedicoBase(BaseModel):
    nome: NomeMedico


class MedicoCreate(MedicoBase):
    especialidade_id: uuid.UUID


class EspecialidadeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nome: str


class MedicoResponse(MedicoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    especialidades: list[EspecialidadeResponse]


class MedicoPage(BaseModel):
    items: list[MedicoResponse]
    next_cursor: str | None
