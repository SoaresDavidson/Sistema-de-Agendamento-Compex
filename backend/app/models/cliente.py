import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    Index,
    String,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.agendamento import Agendamento


class Client(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        CheckConstraint(
            "data_nascimento <= CURRENT_DATE",
            name="ck_cliente_data_nascimento_nao_futura",
        ),
        Index(
            "ix_clientes_nome_data_nascimento",
            "nome",
            "data_nascimento",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)

    telefone: Mapped[str] = mapped_column(String(255), nullable=False)

    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    data_nascimento: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    agendamentos: Mapped[list["Agendamento"]] = relationship(back_populates="cliente")
