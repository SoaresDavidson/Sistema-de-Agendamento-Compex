import uuid

from pydantic import EmailStr
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    String,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Client(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        CheckConstraint(
            "data_nascimento <= CURRENT_TIMESTAMP",
            name="ck_cliente_data_nascimento_nao_futura",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    nome: Mapped[str] = mapped_column(String(255))

    telefone: Mapped[str] = mapped_column(String(255))

    email: Mapped[EmailStr | None] = mapped_column(
        String(255), unique=True, nullable=True
    )

    data_nascimento: Mapped[Date] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
