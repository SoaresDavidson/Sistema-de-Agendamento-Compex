import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.routers import horarios as api_horarios
from app.database import get_db
from app.models.horario import Horario
from app.schemas.horario import HorarioCreate
from app.services.horario import (
    HorarioConflitanteError,
    HorariosLoteConflitantesError,
    IntervaloHorarioInvalidoError,
)
from main import app


@pytest.fixture
def session() -> MagicMock:
    return MagicMock(spec=Session)


@pytest.fixture
def client(session: MagicMock) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def criar_horario() -> Horario:
    return Horario(
        id=uuid.uuid4(),
        medico_id=uuid.uuid4(),
        inicio=datetime(2030, 1, 7, 8, tzinfo=UTC),
        fim=datetime(2030, 1, 7, 9, tzinfo=UTC),
        ativo=True,
    )


def dados_horario() -> dict[str, str]:
    return {
        "medico_id": str(uuid.uuid4()),
        "inicio": "2030-01-07T08:00:00Z",
        "fim": "2030-01-07T09:00:00Z",
    }


def dados_lote() -> dict[str, object]:
    return {
        "medico_id": str(uuid.uuid4()),
        "data_inicio": "2030-01-07",
        "data_fim": "2030-01-07",
        "dias_semana": ["SEGUNDA"],
        "inicio_periodo": "08:00:00",
        "fim_periodo": "10:00:00",
        "duracao_minutos": 60,
    }


def criar_horario_disponivel() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        inicio=datetime(2030, 1, 7, 8, tzinfo=UTC),
        fim=datetime(2030, 1, 7, 9, tzinfo=UTC),
        medico=SimpleNamespace(id=uuid.uuid4(), nome="Dra. Ana"),
    )


def test_consulta_horarios_disponiveis_sem_filtros(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    horario = criar_horario_disponivel()
    consultar = MagicMock(return_value=[horario])
    monkeypatch.setattr(api_horarios, "consultar_horarios_disponiveis", consultar)

    resposta = client.get("/api/horarios/disponiveis")

    assert resposta.status_code == 200
    assert resposta.json() == [
        {
            "id": str(horario.id),
            "inicio": "2030-01-07T08:00:00Z",
            "fim": "2030-01-07T09:00:00Z",
            "medico": {
                "id": str(horario.medico.id),
                "nome": "Dra. Ana",
            },
        }
    ]
    consultar.assert_called_once()
    sessao_recebida, filtros = consultar.call_args.args
    assert sessao_recebida is session
    assert filtros.data is None
    assert filtros.medico_id is None
    assert filtros.especialidade_id is None
    session.commit.assert_not_called()
    session.rollback.assert_not_called()


def test_consulta_horarios_disponiveis_combina_filtros(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    medico_id = uuid.uuid4()
    especialidade_id = uuid.uuid4()
    consultar = MagicMock(return_value=[])
    monkeypatch.setattr(api_horarios, "consultar_horarios_disponiveis", consultar)

    resposta = client.get(
        "/api/horarios/disponiveis",
        params={
            "data": "2030-01-07",
            "medico_id": str(medico_id),
            "especialidade_id": str(especialidade_id),
        },
    )

    assert resposta.status_code == 200
    assert resposta.json() == []
    sessao_recebida, filtros = consultar.call_args.args
    assert sessao_recebida is session
    assert filtros.data.isoformat() == "2030-01-07"
    assert filtros.medico_id == medico_id
    assert filtros.especialidade_id == especialidade_id


@pytest.mark.parametrize(
    "parametros",
    [
        {"data": "data-invalida"},
        {"medico_id": "uuid-invalido"},
        {"especialidade_id": "uuid-invalido"},
    ],
    ids=["data", "medico", "especialidade"],
)
def test_consulta_horarios_disponiveis_rejeita_filtros_invalidos(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    parametros: dict[str, str],
) -> None:
    consultar = MagicMock()
    monkeypatch.setattr(api_horarios, "consultar_horarios_disponiveis", consultar)

    resposta = client.get("/api/horarios/disponiveis", params=parametros)

    assert resposta.status_code == 422
    consultar.assert_not_called()


def test_cria_horario_individual(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    horario = criar_horario()
    cadastrar = MagicMock(return_value=horario)
    monkeypatch.setattr(api_horarios, "cadastrar_horario_individual", cadastrar)

    resposta = client.post("/api/horarios", json=dados_horario())

    assert resposta.status_code == 201
    assert resposta.json()["id"] == str(horario.id)
    assert resposta.json()["ativo"] is True
    cadastrar.assert_called_once()
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


def test_rejeita_dados_invalidos_do_service(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        api_horarios,
        "cadastrar_horario_individual",
        MagicMock(side_effect=IntervaloHorarioInvalidoError("inicio inválido")),
    )

    resposta = client.post("/api/horarios", json=dados_horario())

    assert resposta.status_code == 422
    assert resposta.json() == {"detail": {"mensagem": "inicio inválido"}}
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_retorna_conflito_do_cadastro_individual(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    conflito = criar_horario()
    monkeypatch.setattr(
        api_horarios,
        "cadastrar_horario_individual",
        MagicMock(side_effect=HorarioConflitanteError([conflito])),
    )

    resposta = client.post("/api/horarios", json=dados_horario())

    assert resposta.status_code == 409
    detalhe = resposta.json()["detail"]
    assert detalhe["mensagem"] == "Existem horários sobrepostos para este médico"
    assert detalhe["horarios_existentes"][0]["id"] == str(conflito.id)
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()


def test_valida_requisicao_antes_de_chamar_service(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cadastrar = MagicMock()
    monkeypatch.setattr(api_horarios, "cadastrar_horario_individual", cadastrar)

    resposta = client.post("/api/horarios", json={})

    assert resposta.status_code == 422
    cadastrar.assert_not_called()


def test_cria_horarios_em_lote(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    horarios = [criar_horario(), criar_horario()]
    cadastrar = MagicMock(return_value=horarios)
    monkeypatch.setattr(api_horarios, "cadastrar_horarios_em_lote", cadastrar)

    resposta = client.post("/api/horarios/lote", json=dados_lote())

    assert resposta.status_code == 201
    assert resposta.json()["total_criados"] == 2
    assert len(resposta.json()["horarios"]) == 2
    cadastrar.assert_called_once()
    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()


def test_retorna_conflitos_do_lote(
    client: TestClient,
    session: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    conflito_existente = criar_horario()
    conflito_no_lote = HorarioCreate(
        medico_id=uuid.uuid4(),
        inicio=datetime(2030, 1, 7, 8, tzinfo=UTC),
        fim=datetime(2030, 1, 7, 9, tzinfo=UTC),
    )
    monkeypatch.setattr(
        api_horarios,
        "cadastrar_horarios_em_lote",
        MagicMock(
            side_effect=HorariosLoteConflitantesError(
                [conflito_existente],
                [conflito_no_lote],
            )
        ),
    )

    resposta = client.post("/api/horarios/lote", json=dados_lote())

    assert resposta.status_code == 409
    detalhe = resposta.json()["detail"]
    assert detalhe["horarios_existentes"][0]["id"] == str(conflito_existente.id)
    assert detalhe["horarios_no_lote"] == [
        {
            "medico_id": str(conflito_no_lote.medico_id),
            "inicio": "2030-01-07T08:00:00Z",
            "fim": "2030-01-07T09:00:00Z",
        }
    ]
    session.rollback.assert_called_once_with()
    session.commit.assert_not_called()
