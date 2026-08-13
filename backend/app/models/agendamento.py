import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.cliente import Client
    from app.models.horario import Horario


class StatusAgendamento(StrEnum):
    AGENDADO = "AGENDADO"
    CANCELADO = "CANCELADO"


class Agendamento(Base):
    __tablename__ = "agendamentos"
    __table_args__ = (
        Index(
            "uq_agendamentos_horario_agendado",
            "horario_id",
            unique=True,
            postgresql_where=text("status = 'AGENDADO'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    cliente_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("clientes.id"),
        nullable=False,
    )
    horario_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("horarios.id"),
        nullable=False,
    )
    status: Mapped[StatusAgendamento] = mapped_column(
        Enum(StatusAgendamento, name="status_agendamento"),
        nullable=False,
        default=StatusAgendamento.AGENDADO,
        server_default=StatusAgendamento.AGENDADO.value,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=text("now()"),
    )

    cliente: Mapped["Client"] = relationship(back_populates="agendamentos")
    horario: Mapped["Horario"] = relationship(back_populates="agendamentos")
