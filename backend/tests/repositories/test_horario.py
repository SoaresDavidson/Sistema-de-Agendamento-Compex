import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

from sqlalchemy.orm import Session

from app.models.horario import Horario
from app.repositories.horario import (
    buscar_horario_por_id,
    criar_horario,
    listar_horarios,
)
from app.schemas.horario import HorarioCreate


def criar_dados_validos() -> HorarioCreate:
    inicio = datetime.now(UTC) + timedelta(days=1)
    return HorarioCreate(
        medico_id=uuid.uuid4(),
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )


def test_criar_horario_adiciona_e_executa_flush() -> None:
    session = MagicMock(spec=Session)
    dados = criar_dados_validos()

    horario = criar_horario(session, dados)

    assert isinstance(horario, Horario)
    assert horario.medico_id == dados.medico_id
    assert horario.inicio == dados.inicio
    assert horario.fim == dados.fim
    session.add.assert_called_once_with(horario)
    session.flush.assert_called_once_with()
    session.commit.assert_not_called()


def test_buscar_horario_por_id_utiliza_chave_primaria() -> None:
    session = MagicMock(spec=Session)
    horario_id = uuid.uuid4()
    horario_esperado = MagicMock(spec=Horario)
    session.get.return_value = horario_esperado

    horario = buscar_horario_por_id(session, horario_id)

    assert horario is horario_esperado
    session.get.assert_called_once_with(Horario, horario_id)


def test_listar_horarios_retorna_resultado_da_consulta() -> None:
    session = MagicMock(spec=Session)
    horarios_esperados = [MagicMock(spec=Horario), MagicMock(spec=Horario)]
    session.scalars.return_value.all.return_value = horarios_esperados

    horarios = listar_horarios(session)

    assert horarios == horarios_esperados
    session.scalars.assert_called_once()
