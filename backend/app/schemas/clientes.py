import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    StringConstraints,
    field_validator,
)

Nome = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=255,
    ),
]


class ClienteBase(BaseModel):
    nome: Nome
    telefone: str
    email: EmailStr | None = None
    data_nascimento: date

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, valor: date) -> date:
        if valor > datetime.datetime.now(tz=...).date():
            raise ValueError("data de nascimento não pode ser futura")
        return valor


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class ClientePage(BaseModel):
    items: list[ClienteResponse]
    next_cursor: str | None
