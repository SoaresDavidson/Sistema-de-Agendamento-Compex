from app.models.base import Base
from app.models.cliente import Client
from app.models.especialidade import Especialidade
from app.models.horario import Horario
from app.models.medico import Medico
from app.models.medico_especialidade import tabela_medico_especialidade

__all__ = [
    "Base",
    "Client",
    "Especialidade",
    "Horario",
    "Medico",
    "tabela_medico_especialidade",
]
