import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Uuid, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UUIDBase(Base):
    """Comum a TODOS os models: PK uuid (`gen_random_uuid()`) + flag `active`."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("gen_random_uuid()")
    )
    active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))


class TimestampedBase(UUIDBase):
    """`UUIDBase` + `created_at` (now()). Para models com carimbo de criação."""

    __abstract__ = True

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text("now()")
    )
