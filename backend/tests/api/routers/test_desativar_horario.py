import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.orm import Session
from starlette.testclient import TestClient

from app.models.agendamento import StatusAgendamento
from app.models.cliente import Client
from app.models.horario import Horario
from app.repositories.agendamento import criar_agendamento
from app.repositories.horario import buscar_horario_por_id
from app.schemas.agendamento import AgendamentoCreate

pytestmark = pytest.mark.integration


@pytest.fixture
def horario_ativo(
    banco_postgres: tuple[Session, uuid.UUID],
) -> Horario:
    session, medico_id = banco_postgres
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=True,
    )
    session.add(horario)
    session.flush()
    return horario


@pytest.fixture
def horario_inativo(
    banco_postgres: tuple[Session, uuid.UUID],
) -> Horario:
    session, medico_id = banco_postgres
    inicio = datetime.now(UTC) + timedelta(days=1)
    horario = Horario(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
        ativo=False,
    )
    session.add(horario)
    session.flush()
    return horario


def test_desativar_retorna_404_quando_horario_nao_existe(
    client: tuple[TestClient, Session, uuid.UUID],
) -> None:
    api, _session, _medico_id = client
    id_inexistente = uuid.uuid4()

    resposta = api.patch(f"/api/horarios/{id_inexistente}/desativar")

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Horário não encontrado"}


def test_desativar_retorna_409_quando_horario_ja_inativo(
    client: tuple[TestClient, Session, uuid.UUID],
    horario_inativo: Horario,
) -> None:
    api, _session, _medico_id = client

    resposta = api.patch(f"/api/horarios/{horario_inativo.id}/desativar")

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Horário já está inativo"}


def test_desativar_sucesso_retorna_horario_com_ativo_false(
    client: tuple[TestClient, Session, uuid.UUID],
    horario_ativo: Horario,
) -> None:
    api, session, _medico_id = client

    resposta = api.patch(f"/api/horarios/{horario_ativo.id}/desativar")

    assert resposta.status_code == 200
    body = resposta.json()
    assert body["id"] == str(horario_ativo.id)
    assert body["ativo"] is False

    horario_reconsultado = buscar_horario_por_id(session, horario_ativo.id)
    assert horario_reconsultado is not None
    assert horario_reconsultado.ativo is False


def test_desativar_retorna_409_quando_horario_tem_agendamento_ativo(
    client: tuple[TestClient, Session, uuid.UUID],
    horario_ativo: Horario,
) -> None:
    api, session, _medico_id = client

    # Cria cliente
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=date(1990, 1, 1),
    )
    session.add(cliente)
    session.flush()

    # Cria agendamento AGENDADO vinculado ao horário
    _agendamento = criar_agendamento(
        session,
        AgendamentoCreate(
            cliente_id=cliente.id,
            horario_id=horario_ativo.id,
        ),
    )
    session.commit()

    # Tenta desativar o horário
    resposta = api.patch(f"/api/horarios/{horario_ativo.id}/desativar")

    assert resposta.status_code == 409
    assert (
        resposta.json()["detail"]
        == "Horário possui agendamento ativo. Cancele o agendamento antes de desativar."
    )

    # Confirma que o horário não foi desativado
    horario_reconsultado = buscar_horario_por_id(session, horario_ativo.id)
    assert horario_reconsultado is not None
    assert horario_reconsultado.ativo is True


def test_desativar_sucesso_quando_horario_so_tem_agendamento_cancelado(
    client: tuple[TestClient, Session, uuid.UUID],
    horario_ativo: Horario,
) -> None:
    api, session, _medico_id = client

    # Cria cliente
    cliente = Client(
        nome="Cliente Teste",
        telefone="85999999999",
        email="cliente@teste.com",
        data_nascimento=date(1990, 1, 1),
    )
    session.add(cliente)
    session.flush()

    # Cria agendamento CANCELADO vinculado ao horário
    _agendamento = criar_agendamento(
        session,
        AgendamentoCreate(
            cliente_id=cliente.id,
            horario_id=horario_ativo.id,
        ),
    )
    _agendamento.status = StatusAgendamento.CANCELADO
    session.commit()

    # Desativa o horário — deve funcionar porque o agendamento não está AGENDADO
    resposta = api.patch(f"/api/horarios/{horario_ativo.id}/desativar")

    assert resposta.status_code == 200
    body = resposta.json()
    assert body["id"] == str(horario_ativo.id)
    assert body["ativo"] is False

    horario_reconsultado = buscar_horario_por_id(session, horario_ativo.id)
    assert horario_reconsultado is not None
    assert horario_reconsultado.ativo is False
