import uuid
from unittest.mock import MagicMock

from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
from app.repositories.agendamento import (
    buscar_agendamento_por_id,
    criar_agendamento,
)
from app.schemas.agendamento import AgendamentoCreate


def criar_dados_validos() -> AgendamentoCreate:
    return AgendamentoCreate(
        cliente_id=uuid.uuid4(),
        horario_id=uuid.uuid4(),
    )


def test_criar_agendamento_adiciona_com_status_agendado_e_executa_flush() -> None:
    session = MagicMock(spec=Session)
    dados = criar_dados_validos()

    agendamento = criar_agendamento(session, dados)

    assert isinstance(agendamento, Agendamento)
    assert agendamento.cliente_id == dados.cliente_id
    assert agendamento.horario_id == dados.horario_id
    assert agendamento.status is StatusAgendamento.AGENDADO
    session.add.assert_called_once_with(agendamento)
    session.flush.assert_called_once_with()
    session.commit.assert_not_called()


def test_buscar_agendamento_por_id_utiliza_chave_primaria() -> None:
    session = MagicMock(spec=Session)
    agendamento_id = uuid.uuid4()
    agendamento_esperado = MagicMock(spec=Agendamento)
    session.get.return_value = agendamento_esperado

    agendamento = buscar_agendamento_por_id(session, agendamento_id)

    assert agendamento is agendamento_esperado
    session.get.assert_called_once_with(Agendamento, agendamento_id)
