from sqlalchemy import Column, ForeignKey, Table

from app.models.base import Base

tabela_medico_especialidade = Table(
    "medico_especialidade",
    Base.metadata,
    Column(
        "medico_id",
        ForeignKey("medicos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "especialidade_id",
        ForeignKey("especialidades.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
