import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, CancelamentoOrigem, StatusAgendamento
from app.models.cliente import Client
from app.models.especialidade import Especialidade
from app.models.horario import Horario
from app.models.medico import Medico
from app.services.agendamento import (
    aplicar_cancelamento,
    listar_agendamentos_service,
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


def criar_medico_com_especialidade(session: Session) -> tuple[Medico, Especialidade]:
    # Busca ou cria especialidade para evitar conflito de unique
    especialidade = session.query(Especialidade).filter_by(nome="Cardiologia").first()
    if not especialidade:
        especialidade = Especialidade(nome="Cardiologia")
        session.add(especialidade)
        session.flush()
    medico = Medico(nome="Dra. Mariana Alves", especialidades=[especialidade])
    session.add(medico)
    session.flush()
    return medico, especialidade


def criar_agendamento_mock(
    session: Session,
    medico_id: uuid.UUID,
    cliente_nome: str = "Ana Paula Ribeiro",
    data: datetime | None = None,
    status: StatusAgendamento = StatusAgendamento.AGENDADO,
) -> Agendamento:
    cliente = Client(
        nome=cliente_nome,
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=datetime.now(UTC).date().replace(year=1990),
    )
    inicio = data or (datetime.now(UTC) + timedelta(days=1))
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
        status=status,
    )
    session.add(agendamento)
    session.flush()
    return agendamento


def limpar_agendamentos(session: Session) -> None:
    """Remove todos os agendamentos para isolar os testes."""
    session.query(Agendamento).delete()
    session.flush()


def test_listar_agendamentos_service_retorna_pagina_e_total(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    # Cria 3 agendamentos
    for i in range(3):
        criar_agendamento_mock(session, medico_id, cliente_nome=f"Cliente {i+1}")

    pagina = listar_agendamentos_service(session, page=1, size=5)

    assert pagina.page == 1
    assert pagina.size == 5
    assert pagina.total == 3
    assert pagina.totalPages == 1
    assert len(pagina.items) == 3
    assert all(item.cliente for item in pagina.items)


def test_listar_agendamentos_service_ordena_por_data_horario_crescente(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    # Cria agendamentos fora de ordem
    datas = [
        datetime(2026, 8, 10, 14, 0, tzinfo=UTC),
        datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
        datetime(2026, 8, 11, 8, 0, tzinfo=UTC),
    ]
    for i, data in enumerate(datas):
        criar_agendamento_mock(session, medico_id, cliente_nome=f"Cliente {i+1}", data=data)

    pagina = listar_agendamentos_service(session, page=1, size=5)

    datas_retornadas = [
        datetime.strptime(item.data + " " + item.horario.split("–")[0], "%d/%m/%Y %H:%M").replace(
            tzinfo=UTC
        )
        for item in pagina.items
    ]
    assert datas_retornadas == sorted(datas_retornadas)


def test_listar_agendamentos_service_paginacao_clamp_page(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    for i in range(3):
        criar_agendamento_mock(session, medico_id, cliente_nome=f"Cliente {i+1}")

    # Página maior que totalPages -> clamp para 1
    pagina = listar_agendamentos_service(session, page=10, size=5)

    assert pagina.page == 1
    assert pagina.size == 5
    assert pagina.total == 3
    assert pagina.totalPages == 1


def test_listar_agendamentos_service_pagina_vazia(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, _ = banco_postgres
    limpar_agendamentos(session)

    pagina = listar_agendamentos_service(session, page=1, size=5)

    assert pagina.page == 1
    assert pagina.size == 5
    assert pagina.total == 0
    assert pagina.totalPages == 1
    assert pagina.items == []


def test_listar_agendamentos_service_formata_data_e_horario_corretamente(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    data_teste = datetime(2026, 8, 10, 8, 30, tzinfo=UTC)
    criar_agendamento_mock(session, medico_id, data=data_teste)

    pagina = listar_agendamentos_service(session, page=1, size=5)

    assert len(pagina.items) == 1
    item = pagina.items[0]
    assert item.data == "10/08/2026"
    assert item.horario == "08:30–09:30"
