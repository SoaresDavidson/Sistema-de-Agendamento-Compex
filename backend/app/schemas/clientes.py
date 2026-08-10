import uuid
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints
from sqlalchemy import Date

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
    email: EmailStr | None
    data_nascimento: Date


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class ClientePage(BaseModel):
    items: list[ClienteResponse]
    next_cursor: str | None
