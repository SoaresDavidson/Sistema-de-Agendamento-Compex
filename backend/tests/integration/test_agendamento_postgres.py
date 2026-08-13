import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.agendamento import StatusAgendamento
from app.models.cliente import Client
from app.models.horario import Horario
from app.repositories.agendamento import (
    buscar_agendamento_por_id,
    criar_agendamento,
)
from app.repositories.horario import buscar_horario_para_agendamento
from app.schemas.agendamento import AgendamentoCreate

pytestmark = pytest.mark.integration


def criar_cliente_e_horario(
    session: Session,
    medico_id: uuid.UUID,
) -> tuple[Client, Horario]:
    cliente = Client(
        nome="Cliente Agendamento",
        telefone="85999999999",
        email="cliente@example.com",
        data_nascimento=date(1990, 1, 1),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )
    session.add_all([cliente, horario])
    session.flush()
    return cliente, horario


def test_cria_e_consulta_agendamento_com_relacionamentos_no_postgres(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente, horario = criar_cliente_e_horario(session, medico_id)

    agendamento_criado = criar_agendamento(
        session,
        AgendamentoCreate(
            cliente_id=cliente.id,
            horario_id=horario.id,
        ),
    )
    agendamento_id = agendamento_criado.id
    cliente_id = cliente.id
    horario_id = horario.id
    session.expunge_all()

    agendamento = buscar_agendamento_por_id(session, agendamento_id)
    cliente = session.get(Client, cliente_id)
    horario = buscar_horario_para_agendamento(session, horario_id)

    assert agendamento is not None
    assert cliente is not None
    assert horario is not None
    assert agendamento.cliente_id == cliente_id
    assert agendamento.horario_id == horario_id
    assert agendamento.status is StatusAgendamento.AGENDADO
    assert agendamento.criado_em.tzinfo is not None
    assert agendamento.cliente is cliente
    assert agendamento.horario is horario
    assert [item.id for item in cliente.agendamentos] == [agendamento_id]
    assert [item.id for item in horario.agendamentos] == [agendamento_id]


def test_impede_dois_agendamentos_ativos_para_o_mesmo_horario_no_postgres(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente, horario = criar_cliente_e_horario(session, medico_id)
    dados = AgendamentoCreate(cliente_id=cliente.id, horario_id=horario.id)
    criar_agendamento(session, dados)

    with pytest.raises(IntegrityError), session.begin_nested():
        criar_agendamento(session, dados)


def test_permite_novo_agendamento_quando_anterior_esta_cancelado_no_postgres(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente, horario = criar_cliente_e_horario(session, medico_id)
    dados = AgendamentoCreate(cliente_id=cliente.id, horario_id=horario.id)
    anterior = criar_agendamento(session, dados)
    anterior.status = StatusAgendamento.CANCELADO
    session.flush()

    novo = criar_agendamento(session, dados)

    assert anterior.status is StatusAgendamento.CANCELADO
    assert novo.status is StatusAgendamento.AGENDADO
