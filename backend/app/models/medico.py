from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase
from app.models.especialidade import Especialidade
from app.models.medico_especialidade import tabela_medico_especialidade


class Medico(TimestampedBase):
    __tablename__ = "medicos"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    especialidades: Mapped[list[Especialidade]] = relationship(
        secondary=tabela_medico_especialidade
    )
