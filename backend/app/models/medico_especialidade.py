from sqlalchemy import Column, ForeignKey, Table

from app.models.base import Base

tabela_medico_especialidade = Table(
    "medico_especialidade",
    Base.metadata,
    Column("medico_id", ForeignKey("medicos.id"), primary_key=True),
    Column("especialidade_id", ForeignKey("especialidades.id"), primary_key=True),
)
