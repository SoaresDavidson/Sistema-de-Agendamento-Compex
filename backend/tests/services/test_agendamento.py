import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.agendamento import Agendamento, StatusAgendamento
from app.schemas.agendamento import AgendamentoCreate
from app.services import agendamento as servico_agendamento
from app.services.agendamento import (
    ClienteNaoEncontradoError,
    HorarioIndisponivelError,
    HorarioNaoEncontradoParaAgendamentoError,
    realizar_agendamento,
)


def criar_dados() -> AgendamentoCreate:
    return AgendamentoCreate(cliente_id=uuid.uuid4(), horario_id=uuid.uuid4())


def criar_horario(
    *,
    ativo: bool = True,
    inicio: datetime | None = None,
    status_agendamento: StatusAgendamento | None = None,
) -> SimpleNamespace:
    agendamentos = (
        [SimpleNamespace(status=status_agendamento)]
        if status_agendamento is not None
        else []
    )
    return SimpleNamespace(
        ativo=ativo,
        inicio=inicio or datetime(2030, 1, 7, 8, tzinfo=UTC),
        agendamentos=agendamentos,
    )


def test_realiza_agendamento_para_cliente_e_horario_disponivel(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    dados = criar_dados()
    agendamento = MagicMock(spec=Agendamento)
    buscar_cliente = MagicMock(return_value=SimpleNamespace(id=dados.cliente_id))
    buscar_horario = MagicMock(return_value=criar_horario())
    persistir = MagicMock(return_value=agendamento)
    monkeypatch.setattr(servico_agendamento, "buscar_cliente_por_id", buscar_cliente)
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_horario_para_agendamento",
        buscar_horario,
    )
    monkeypatch.setattr(servico_agendamento, "criar_agendamento", persistir)

    resultado = realizar_agendamento(
        session,
        dados,
        agora=datetime(2030, 1, 1, tzinfo=UTC),
    )

    assert resultado is agendamento
    buscar_cliente.assert_called_once_with(session, dados.cliente_id)
    buscar_horario.assert_called_once_with(session, dados.horario_id)
    persistir.assert_called_once_with(session, dados)
    session.commit.assert_not_called()


def test_rejeita_cliente_inexistente_sem_consultar_horario(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dados = criar_dados()
    buscar_horario = MagicMock()
    persistir = MagicMock()
    monkeypatch.setattr(servico_agendamento, "buscar_cliente_por_id", lambda *_: None)
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_horario_para_agendamento",
        buscar_horario,
    )
    monkeypatch.setattr(servico_agendamento, "criar_agendamento", persistir)

    with pytest.raises(ClienteNaoEncontradoError):
        realizar_agendamento(MagicMock(spec=Session), dados)

    buscar_horario.assert_not_called()
    persistir.assert_not_called()


def test_rejeita_horario_inexistente_sem_persistir(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dados = criar_dados()
    persistir = MagicMock()
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_cliente_por_id",
        lambda *_: SimpleNamespace(id=dados.cliente_id),
    )
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_horario_para_agendamento",
        lambda *_: None,
    )
    monkeypatch.setattr(servico_agendamento, "criar_agendamento", persistir)

    with pytest.raises(HorarioNaoEncontradoParaAgendamentoError):
        realizar_agendamento(MagicMock(spec=Session), dados)

    persistir.assert_not_called()


@pytest.mark.parametrize(
    "horario",
    [
        criar_horario(ativo=False),
        criar_horario(inicio=datetime(2030, 1, 1, tzinfo=UTC)),
        criar_horario(status_agendamento=StatusAgendamento.AGENDADO),
    ],
    ids=["inativo", "ocorrido", "agendado"],
)
def test_rejeita_horario_indisponivel_sem_persistir(
    monkeypatch: pytest.MonkeyPatch,
    horario: SimpleNamespace,
) -> None:
    dados = criar_dados()
    persistir = MagicMock()
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_cliente_por_id",
        lambda *_: SimpleNamespace(id=dados.cliente_id),
    )
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_horario_para_agendamento",
        lambda *_: horario,
    )
    monkeypatch.setattr(servico_agendamento, "criar_agendamento", persistir)

    with pytest.raises(HorarioIndisponivelError):
        realizar_agendamento(
            MagicMock(spec=Session),
            dados,
            agora=datetime(2030, 1, 2, tzinfo=UTC),
        )

    persistir.assert_not_called()


def test_agendamento_cancelado_nao_impede_reutilizacao_do_horario(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    dados = criar_dados()
    agendamento = MagicMock(spec=Agendamento)
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_cliente_por_id",
        lambda *_: SimpleNamespace(id=dados.cliente_id),
    )
    monkeypatch.setattr(
        servico_agendamento,
        "buscar_horario_para_agendamento",
        lambda *_: criar_horario(status_agendamento=StatusAgendamento.CANCELADO),
    )
    monkeypatch.setattr(
        servico_agendamento,
        "criar_agendamento",
        MagicMock(return_value=agendamento),
    )

    resultado = realizar_agendamento(
        session,
        dados,
        agora=datetime(2030, 1, 2, tzinfo=UTC),
    )

    assert resultado is agendamento
