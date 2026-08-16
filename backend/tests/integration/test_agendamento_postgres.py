import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.cliente import Client
from app.models.horario import Horario
from app.repositories.agendamento import (
    buscar_agendamento_por_id,
    criar_agendamento,
    listar_agendamentos,
)
from app.repositories.horario import buscar_horario_para_agendamento
from app.schemas.agendamento import AgendamentoCreate, StatusAgendamentoExibicao

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


def test_listagem_paginada_ordenada_por_data_horario_crescente(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    # Cria 7 agendamentos em ordem aleatória
    datas = [
        datetime(2026, 8, 11, 14, 0, tzinfo=UTC),
        datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
        datetime(2026, 8, 10, 14, 0, tzinfo=UTC),
        datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
        datetime(2026, 8, 11, 8, 0, tzinfo=UTC),
        datetime(2026, 8, 12, 8, 0, tzinfo=UTC),
        datetime(2026, 8, 9, 16, 0, tzinfo=UTC),
    ]

    for i, data in enumerate(datas):
        cliente = Client(
            nome=f"Cliente {i+1}",
            telefone="85999999999",
            email=f"cliente{i}@example.com",
            data_nascimento=date(1990, 1, 1),
        )
        horario = Horario(
            medico_id=medico_id,
            inicio=data,
            fim=data + timedelta(hours=1),
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

    # Testa paginação: página 1 (5 itens)
    stmt = (
        session.query(Agendamento)
        .join(Horario, Agendamento.horario_id == Horario.id)
        .order_by(Horario.inicio.asc())
        .limit(5)
    )
    pagina1 = session.scalars(stmt).all()

    assert len(pagina1) == 5
    # Verifica ordenação crescente por inicio
    inicios = [a.horario.inicio for a in pagina1]
    assert inicios == sorted(inicios)

    # Testa total de itens
    total = session.query(Agendamento).count()
    assert total == 7


def test_listagem_paginada_segunda_pagina(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    for i in range(7):
        cliente = Client(
            nome=f"Cliente {i+1}",
            telefone="85999999999",
            email=f"cliente{i}@example.com",
            data_nascimento=date(1990, 1, 1),
        )
        inicio = datetime(2026, 8, 10 + i // 3, 8 + (i % 3) * 3, 0, tzinfo=UTC)
        horario = Horario(
            medico_id=medico_id,
            inicio=inicio,
            fim=inicio + timedelta(hours=1),
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

    # Página 2 com size=5
    stmt = (
        session.query(Agendamento)
        .join(Horario, Agendamento.horario_id == Horario.id)
        .order_by(Horario.inicio.asc())
        .offset(5)
        .limit(5)
    )
    pagina2 = session.scalars(stmt).all()

    assert len(pagina2) == 2
    # Verifica que continua ordenado
    inicios = [a.horario.inicio for a in pagina2]
    assert inicios == sorted(inicios)


def test_listagem_vazia_retorna_sem_erro(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, _ = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    # Não cria nenhum agendamento, apenas consulta
    stmt = (
        session.query(Agendamento)
        .join(Horario, Agendamento.horario_id == Horario.id)
        .order_by(Horario.inicio.asc())
        .limit(5)
    )
    resultados = session.scalars(stmt).all()

    assert resultados == []

    total = session.query(Agendamento).count()
    assert total == 0


def test_listar_agendamentos_repository_filtra_por_cliente_e_data_com_count(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    for i, data in enumerate(
        [
            datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
            datetime(2026, 8, 10, 9, 0, tzinfo=UTC),
            datetime(2026, 8, 11, 8, 0, tzinfo=UTC),
        ]
    ):
        cliente = Client(
            nome="Cliente Filtro" if i == 0 else f"Cliente {i+1}",
            telefone="85999999999",
            email=f"filtro{i}@example.com",
            data_nascimento=date(1990, 1, 1),
        )
        horario = Horario(
            medico_id=medico_id,
            inicio=data,
            fim=data + timedelta(hours=1),
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

    agendamentos, total = listar_agendamentos(
        session,
        page=1,
        size=5,
        cliente="filtro",
        data=date(2026, 8, 10),
    )

    assert total == 1
    assert len(agendamentos) == 1
    assert agendamentos[0].cliente.nome == "Cliente Filtro"


def test_listar_agendamentos_repository_filtra_por_status_com_count(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    for i, status in enumerate(
        [StatusAgendamento.AGENDADO, StatusAgendamento.CANCELADO]
    ):
        cliente = Client(
            nome=f"Cliente {i+1}",
            telefone="85999999999",
            email=f"status{i}@example.com",
            data_nascimento=date(1990, 1, 1),
        )
        inicio = datetime(2026, 8, 10, 8 + i, 0, tzinfo=UTC)
        horario = Horario(
            medico_id=medico_id,
            inicio=inicio,
            fim=inicio + timedelta(hours=1),
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

    agendamentos, total = listar_agendamentos(
        session,
        page=1,
        size=5,
        status=StatusAgendamentoExibicao.CANCELADO,
    )

    assert total == 1
    assert len(agendamentos) == 1
    assert agendamentos[0].status is StatusAgendamento.CANCELADO


def test_listar_agendamentos_repository_filtra_concluido_e_agendado_por_horario(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    session.query(Agendamento).delete()
    session.flush()

    agora = datetime(2026, 8, 15, 12, 0, tzinfo=UTC)
    datas = [
        datetime(2026, 8, 10, 8, 0, tzinfo=UTC),
        datetime(2027, 8, 10, 8, 0, tzinfo=UTC),
    ]
    for i, inicio in enumerate(datas):
        cliente = Client(
            nome=f"Cliente {i+1}",
            telefone="85999999999",
            email=f"venc{i}@example.com",
            data_nascimento=date(1990, 1, 1),
        )
        horario = Horario(
            medico_id=medico_id,
            inicio=inicio,
            fim=inicio + timedelta(hours=1),
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

    concluidos, total_concluido = listar_agendamentos(
        session,
        page=1,
        size=5,
        status=StatusAgendamentoExibicao.CONCLUIDO,
        agora=agora,
    )
    assert total_concluido == 1
    assert len(concluidos) == 1
    assert concluidos[0].horario.fim < agora

    agendados, total_agendado = listar_agendamentos(
        session,
        page=1,
        size=5,
        status=StatusAgendamentoExibicao.AGENDADO,
        agora=agora,
    )
    assert total_agendado == 1
    assert len(agendados) == 1
    assert agendados[0].horario.fim >= agora
