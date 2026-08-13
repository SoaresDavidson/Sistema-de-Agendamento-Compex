import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock

from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Session

from app.models.horario import Horario
from app.repositories.horario import (
    buscar_horario_para_agendamento,
    buscar_horario_por_id,
    criar_horario,
    listar_horarios,
    listar_horarios_filtrados,
)
from app.schemas.horario import HorarioCreate, HorarioDisponivelFiltros


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


def test_buscar_horario_para_agendamento_bloqueia_e_carrega_agendamentos() -> None:
    session = MagicMock(spec=Session)
    horario_id = uuid.uuid4()
    horario_esperado = MagicMock(spec=Horario)
    session.scalar.return_value = horario_esperado

    horario = buscar_horario_para_agendamento(session, horario_id)

    assert horario is horario_esperado
    statement = session.scalar.call_args.args[0]
    consulta_postgres = str(statement.compile(dialect=postgresql.dialect()))
    parametros = statement.compile().params

    assert "WHERE horarios.id =" in consulta_postgres
    assert "FOR UPDATE" in consulta_postgres
    assert horario_id in parametros.values()
    assert statement._with_options


def test_listar_horarios_retorna_resultado_da_consulta() -> None:
    session = MagicMock(spec=Session)
    horarios_esperados = [MagicMock(spec=Horario), MagicMock(spec=Horario)]
    session.scalars.return_value.all.return_value = horarios_esperados

    horarios = listar_horarios(session)

    assert horarios == horarios_esperados
    session.scalars.assert_called_once()


def test_listar_horarios_filtrados_aceita_consulta_sem_filtros() -> None:
    session = MagicMock(spec=Session)
    horarios_esperados = [MagicMock(spec=Horario)]
    session.scalars.return_value.all.return_value = horarios_esperados

    horarios = listar_horarios_filtrados(session, HorarioDisponivelFiltros())

    assert horarios == horarios_esperados
    statement = session.scalars.call_args.args[0]
    assert statement.whereclause is None


def test_listar_horarios_filtrados_combina_todos_os_filtros() -> None:
    session = MagicMock(spec=Session)
    session.scalars.return_value.all.return_value = []
    filtros = HorarioDisponivelFiltros(
        data=date(2030, 1, 7),
        medico_id=uuid.uuid4(),
        especialidade_id=uuid.uuid4(),
    )

    horarios = listar_horarios_filtrados(session, filtros)

    assert horarios == []
    statement = session.scalars.call_args.args[0]
    parametros = statement.compile().params
    consulta = str(statement)

    assert "horarios.inicio >=" in consulta
    assert "horarios.inicio <" in consulta
    assert "horarios.medico_id =" in consulta
    assert "especialidades.id =" in consulta
    assert datetime(2030, 1, 7, tzinfo=UTC) in parametros.values()
    assert datetime(2030, 1, 8, tzinfo=UTC) in parametros.values()
    assert filtros.medico_id in parametros.values()
    assert filtros.especialidade_id in parametros.values()
