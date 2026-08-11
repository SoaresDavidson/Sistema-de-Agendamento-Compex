import uuid
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.repositories.especialidade import criar_especialidade, listar_especialidade
from app.schemas.especialidade import EspecialidadeCreate


def criar_payload_valido() -> EspecialidadeCreate:
    return EspecialidadeCreate(nome="Cardiologia")


def criar_modelo_especialidade() -> Especialidade:
    return Especialidade(id=uuid.uuid4(), nome="Cardiologia")


def test_criar_especialidade_adiciona_e_executa_flush() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido()

    especialidade = criar_especialidade(session, payload)

    assert isinstance(especialidade, Especialidade)
    assert especialidade.nome == payload.nome
    session.add.assert_called_once_with(especialidade)
    session.flush.assert_called_once_with()
    session.commit.assert_not_called()


def test_listar_especialidades_sem_proxima_pagina() -> None:
    session = MagicMock(spec=Session)
    especialidades_esperadas = [
        criar_modelo_especialidade(),
        criar_modelo_especialidade(),
    ]
    session.scalars.return_value.all.return_value = especialidades_esperadas

    especialidades, proximo_id = listar_especialidade(session, limit=2)

    assert especialidades == especialidades_esperadas
    assert proximo_id is None
    session.scalars.assert_called_once()


def test_listar_especialidades_remove_excedente_e_retorna_cursor() -> None:
    session = MagicMock(spec=Session)
    especialidades_retornadas = [
        criar_modelo_especialidade(),
        criar_modelo_especialidade(),
        criar_modelo_especialidade(),
    ]
    session.scalars.return_value.all.return_value = especialidades_retornadas

    especialidades, proximo_id = listar_especialidade(session, limit=2)

    assert especialidades == especialidades_retornadas[:2]
    assert proximo_id == especialidades_retornadas[1].id


def test_listar_especialidades_aplica_cursor_na_consulta() -> None:
    session = MagicMock(spec=Session)
    cursor_id = uuid.uuid4()
    session.scalars.return_value.all.return_value = []

    especialidades, proximo_id = listar_especialidade(
        session,
        cursor_id=cursor_id,
    )

    assert especialidades == []
    assert proximo_id is None
    statement = session.scalars.call_args.args[0]
    assert cursor_id in statement.compile().params.values()


@pytest.mark.parametrize(
    ("limit", "limite_sql"),
    [(0, 2), (101, 101)],
)
def test_listar_especialidades_limita_tamanho_da_pagina(
    limit: int,
    limite_sql: int,
) -> None:
    session = MagicMock(spec=Session)
    session.scalars.return_value.all.return_value = []

    listar_especialidade(session, limit=limit)

    statement = session.scalars.call_args.args[0]
    sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert f"LIMIT {limite_sql}" in sql
