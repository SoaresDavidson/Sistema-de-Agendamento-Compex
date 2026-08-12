import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.medico import Medico


class Horario(Base):
    __tablename__ = "horarios"
    __table_args__ = (
        CheckConstraint("inicio < fim", name="ck_horarios_inicio_anterior_fim"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    medico_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("medicos.id"),
        nullable=False,
    )
    medico: Mapped["Medico"] = relationship(back_populates="horarios")
    inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    fim: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )
