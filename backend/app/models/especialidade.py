from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampedBase


class Especialidade(TimestampedBase):
    __tablename__ = "especialidades"

    nome: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
