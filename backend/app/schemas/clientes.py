import uuid
from datetime import UTC, date, datetime
from typing import Annotated, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    StringConstraints,
    field_validator,
    model_validator,
)

Nome = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=255,
    ),
]

Telefone = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=255,
    ),
]


class ClienteBase(BaseModel):
    nome: Nome
    telefone: Telefone
    email: EmailStr | None = None
    data_nascimento: date

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_nome(cls, valor: object) -> object:
        if isinstance(valor, str):
            return " ".join(valor.split())
        return valor

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email_vazio(cls, valor: object) -> object:
        if isinstance(valor, str) and not valor.strip():
            return None
        return valor

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, valor: date) -> date:
        if valor > datetime.now(UTC).date():
            raise ValueError("data de nascimento não pode ser futura")
        return valor


class ClienteCreate(ClienteBase):
    confirmar_duplicidade: bool = False


class ClienteUpdate(BaseModel):
    nome: Nome | None = None
    telefone: Telefone | None = None
    email: EmailStr | None = None
    data_nascimento: date | None = None
    confirmar_duplicidade: bool = False

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_nome(cls, valor: object) -> object:
        if isinstance(valor, str):
            return " ".join(valor.split())
        return valor

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email_vazio(cls, valor: object) -> object:
        if isinstance(valor, str) and not valor.strip():
            return None
        return valor

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, valor: date | None) -> date | None:
        if valor is not None and valor > datetime.now(UTC).date():
            raise ValueError("data de nascimento não pode ser futura")
        return valor

    @model_validator(mode="after")
    def validar_campos_fornecidos(self) -> Self:
        campos_atualizaveis = {
            "nome",
            "telefone",
            "email",
            "data_nascimento",
        }
        if not campos_atualizaveis & self.model_fields_set:
            raise ValueError("ao menos um campo deve ser informado")

        campos_obrigatorios = {"nome", "telefone", "data_nascimento"}
        if any(
            campo in self.model_fields_set and getattr(self, campo) is None
            for campo in campos_obrigatorios
        ):
            raise ValueError("campos obrigatórios não podem ser nulos")
        return self


class ClienteResponse(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class ClientePage(BaseModel):
    items: list[ClienteResponse]
    next_cursor: str | None
