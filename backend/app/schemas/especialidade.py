import uuid
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

NomeEspecialidade = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=255,
    ),
]


class EspecialidadeBase(BaseModel):
    nome: NomeEspecialidade

    @field_validator("nome")
    @classmethod
    def normalizar_espacos(cls, valor: str) -> str:
        return " ".join(valor.split())


class EspecialidadeCreate(EspecialidadeBase):
    pass


class EspecialidadeUpdate(EspecialidadeBase):
    pass


class EspecialidadeResponse(EspecialidadeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class EspecialidadePage(BaseModel):
    items: list[EspecialidadeResponse]
    next_cursor: str | None
