import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, CancelamentoOrigem, StatusAgendamento
from app.models.cliente import Client
from app.models.horario import Horario
from app.services.agendamento import (
    aplicar_cancelamento,
    validar_cancelamento,
)

pytestmark = pytest.mark.integration


def test_aplicar_cancelamento_cliente_mantem_horario_ativo(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add_all([cliente, horario])
    session.flush()

    agendamento = Agendamento(
        cliente_id=cliente.id,
        horario_id=horario.id,
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    agendamento_id = agendamento.id
    horario_id = horario.id
    session.expunge_all()

    # Valida o cancelamento
    agendamento_validado = validar_cancelamento(session, agendamento_id)
    # Aplica o cancelamento com origem CLIENTE
    agendamento_cancelado = aplicar_cancelamento(
        session,
        agendamento_validado,
        CancelamentoOrigem.CLIENTE,
        "Paciente desmarcou",
    )

    assert agendamento_cancelado.status is StatusAgendamento.CANCELADO
    assert agendamento_cancelado.cancelado_por is CancelamentoOrigem.CLIENTE
    assert agendamento_cancelado.cancelado_em is not None
    assert agendamento_cancelado.observacao_cancelamento == "Paciente desmarcou"

    # Verifica que o horário permanece ativo
    horario_reconsultado = session.get(Horario, horario_id)
    assert horario_reconsultado is not None
    assert horario_reconsultado.ativo is True


def test_aplicar_cancelamento_medico_desativa_horario(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add_all([cliente, horario])
    session.flush()

    agendamento = Agendamento(
        cliente_id=cliente.id,
        horario_id=horario.id,
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    agendamento_id = agendamento.id
    horario_id = horario.id
    session.expunge_all()

    agendamento_validado = validar_cancelamento(session, agendamento_id)
    agendamento_cancelado = aplicar_cancelamento(
        session,
        agendamento_validado,
        CancelamentoOrigem.MEDICO,
        "Indisponibilidade do médico",
    )

    assert agendamento_cancelado.status is StatusAgendamento.CANCELADO
    assert agendamento_cancelado.cancelado_por is CancelamentoOrigem.MEDICO
    assert agendamento_cancelado.cancelado_em is not None
    assert (
        agendamento_cancelado.observacao_cancelamento == "Indisponibilidade do médico"
    )

    # Verifica que o horário foi desativado
    horario_reconsultado = session.get(Horario, horario_id)
    assert horario_reconsultado is not None
    assert horario_reconsultado.ativo is False


def test_aplicar_cancelamento_observacao_preservada_quando_informada(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add_all([cliente, horario])
    session.flush()

    agendamento = Agendamento(
        cliente_id=cliente.id,
        horario_id=horario.id,
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    agendamento_id = agendamento.id
    session.expunge_all()

    agendamento_validado = validar_cancelamento(session, agendamento_id)
    agendamento_cancelado = aplicar_cancelamento(
        session,
        agendamento_validado,
        CancelamentoOrigem.CLIENTE,
        "  Paciente ligou para desmarcar  ",
    )

    assert (
        agendamento_cancelado.observacao_cancelamento == "Paciente ligou para desmarcar"
    )


def test_aplicar_cancelamento_observacao_vazia_vira_none(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add_all([cliente, horario])
    session.flush()

    agendamento = Agendamento(
        cliente_id=cliente.id,
        horario_id=horario.id,
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    agendamento_id = agendamento.id
    session.expunge_all()

    agendamento_validado = validar_cancelamento(session, agendamento_id)
    agendamento_cancelado = aplicar_cancelamento(
        session,
        agendamento_validado,
        CancelamentoOrigem.CLIENTE,
        "   ",
    )

    assert agendamento_cancelado.observacao_cancelamento is None


def test_aplicar_cancelamento_sem_observacao_vira_none(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add_all([cliente, horario])
    session.flush()

    agendamento = Agendamento(
        cliente_id=cliente.id,
        horario_id=horario.id,
        status=StatusAgendamento.AGENDADO,
    )
    session.add(agendamento)
    session.flush()
    agendamento_id = agendamento.id
    session.expunge_all()

    agendamento_validado = validar_cancelamento(session, agendamento_id)
    agendamento_cancelado = aplicar_cancelamento(
        session,
        agendamento_validado,
        CancelamentoOrigem.CLIENTE,
        None,
    )

    assert agendamento_cancelado.observacao_cancelamento is None
