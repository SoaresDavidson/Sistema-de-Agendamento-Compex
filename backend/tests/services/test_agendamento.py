import uuid
from datetime import UTC, date, datetime, timedelta

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


def criar_medico_com_especialidade(
    session: Session,
    nome_medico: str = "Dra. Mariana Alves",
    nome_especialidade: str = "Cardiologia",
) -> tuple[Medico, Especialidade]:
    # Busca ou cria especialidade para evitar conflito de unique
    especialidade = session.query(Especialidade).filter_by(nome=nome_especialidade).first()
    if not especialidade:
        especialidade = Especialidade(nome=nome_especialidade)
        session.add(especialidade)
        session.flush()
    medico = Medico(nome=nome_medico, especialidades=[especialidade])
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


def criar_agendamento_para_medico(
    session: Session,
    medico: Medico,
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
        medico_id=medico.id,
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


def test_listar_agendamentos_service_filtra_por_cliente_parcial(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    criar_agendamento_mock(session, medico_id, cliente_nome="Ana Paula Ribeiro")
    criar_agendamento_mock(session, medico_id, cliente_nome="Bruno Henrique Lima")

    pagina = listar_agendamentos_service(session, page=1, size=5, cliente="ana")

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].cliente == "Ana Paula Ribeiro"


def test_listar_agendamentos_service_filtra_por_medico_exato(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, _ = banco_postgres
    limpar_agendamentos(session)
    medico_a, _ = criar_medico_com_especialidade(
        session, nome_medico="Dra. Mariana Alves"
    )
    medico_b, _ = criar_medico_com_especialidade(
        session, nome_medico="Dr. Rafael Monteiro"
    )

    criar_agendamento_para_medico(session, medico_a, cliente_nome="Cliente A")
    criar_agendamento_para_medico(session, medico_b, cliente_nome="Cliente B")

    pagina = listar_agendamentos_service(
        session, page=1, size=5, medico="Dr. Rafael Monteiro"
    )

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].medico == "Dr. Rafael Monteiro"
    assert pagina.items[0].cliente == "Cliente B"


def test_listar_agendamentos_service_filtra_por_especialidade(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, _ = banco_postgres
    limpar_agendamentos(session)
    medico_a, _ = criar_medico_com_especialidade(
        session, nome_especialidade="Cardiologia"
    )
    medico_b, _ = criar_medico_com_especialidade(
        session, nome_especialidade="Dermatologia"
    )

    criar_agendamento_para_medico(session, medico_a, cliente_nome="Cliente A")
    criar_agendamento_para_medico(session, medico_b, cliente_nome="Cliente B")

    pagina = listar_agendamentos_service(
        session, page=1, size=5, especialidade="Dermatologia"
    )

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].especialidade == "Dermatologia"


def test_listar_agendamentos_service_filtra_por_status(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    criar_agendamento_mock(session, medico_id, cliente_nome="Cliente A")
    criar_agendamento_mock(
        session,
        medico_id,
        cliente_nome="Cliente B",
        status=StatusAgendamento.CANCELADO,
    )

    pagina = listar_agendamentos_service(
        session, page=1, size=5, status="CANCELADO"
    )

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].status is StatusAgendamento.CANCELADO


def test_listar_agendamentos_service_filtra_por_data(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    criar_agendamento_mock(
        session,
        medico_id,
        cliente_nome="Cliente A",
        data=datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
    )
    criar_agendamento_mock(
        session,
        medico_id,
        cliente_nome="Cliente B",
        data=datetime(2026, 8, 11, 8, 0, tzinfo=UTC),
    )

    pagina = listar_agendamentos_service(
        session, page=1, size=5, data=date(2026, 8, 10)
    )

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].cliente == "Cliente A"
    assert pagina.items[0].data == "10/08/2026"


def test_listar_agendamentos_service_filtros_combinados(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, _ = banco_postgres
    limpar_agendamentos(session)
    medico_a, _ = criar_medico_com_especialidade(
        session, nome_medico="Dra. Mariana Alves", nome_especialidade="Cardiologia"
    )
    medico_b, _ = criar_medico_com_especialidade(
        session, nome_medico="Dr. Rafael Monteiro", nome_especialidade="Dermatologia"
    )

    criar_agendamento_para_medico(
        session,
        medico_a,
        cliente_nome="Ana Paula Ribeiro",
        data=datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
    )
    criar_agendamento_para_medico(
        session,
        medico_a,
        cliente_nome="Bruno Henrique Lima",
        data=datetime(2026, 8, 10, 9, 0, tzinfo=UTC),
    )
    criar_agendamento_para_medico(
        session,
        medico_b,
        cliente_nome="Ana Paula Ribeiro",
        data=datetime(2026, 8, 10, 10, 0, tzinfo=UTC),
    )

    pagina = listar_agendamentos_service(
        session,
        page=1,
        size=5,
        cliente="ana",
        medico="Dra. Mariana Alves",
        especialidade="Cardiologia",
        status="AGENDADO",
        data=date(2026, 8, 10),
    )

    assert pagina.total == 1
    assert len(pagina.items) == 1
    assert pagina.items[0].cliente == "Ana Paula Ribeiro"


def test_listar_agendamentos_service_status_desconhecido_retorna_vazio(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    limpar_agendamentos(session)
    _, _ = criar_medico_com_especialidade(session)

    criar_agendamento_mock(session, medico_id, cliente_nome="Cliente A")

    pagina = listar_agendamentos_service(
        session, page=1, size=5, status="CONCLUIDO"
    )

    assert pagina.total == 0
    assert pagina.items == []
    assert pagina.totalPages == 1
