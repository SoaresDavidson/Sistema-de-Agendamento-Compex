import uuid
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.models.medico import Medico
from app.repositories.medico import criar_medico, listar_medico
from app.schemas.medico import MedicoCreate


def criar_payload_valido() -> MedicoCreate:
    return MedicoCreate(
        nome="Dra. Mariana Alves",
        especialidade_id=uuid.uuid4(),
    )


def criar_modelo_medico() -> Medico:
    return Medico(id=uuid.uuid4(), nome="Dra. Mariana Alves")


def test_criar_medico_com_especialidade_adiciona_e_executa_flush() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido()
    especialidade = Especialidade(
        id=payload.especialidade_id,
        nome="Cardiologia",
    )
    session.get.return_value = especialidade

    medico = criar_medico(session, payload)

    assert isinstance(medico, Medico)
    assert medico.nome == payload.nome
    assert medico.especialidades == [especialidade]
    session.get.assert_called_once_with(Especialidade, payload.especialidade_id)
    session.add.assert_called_once_with(medico)
    session.flush.assert_called_once_with()
    session.commit.assert_not_called()


def test_criar_medico_retorna_none_quando_especialidade_nao_existe() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload_valido()
    session.get.return_value = None

    medico = criar_medico(session, payload)

    assert medico is None
    session.get.assert_called_once_with(Especialidade, payload.especialidade_id)
    session.add.assert_not_called()
    session.flush.assert_not_called()
    session.commit.assert_not_called()


def test_listar_medicos_sem_proxima_pagina() -> None:
    session = MagicMock(spec=Session)
    medicos_esperados = [criar_modelo_medico(), criar_modelo_medico()]
    session.scalars.return_value.all.return_value = medicos_esperados

    medicos, proximo_id = listar_medico(session, limit=2)

    assert medicos == medicos_esperados
    assert proximo_id is None
    session.scalars.assert_called_once()


def test_listar_medicos_remove_excedente_e_retorna_cursor() -> None:
    session = MagicMock(spec=Session)
    medicos_retornados = [
        criar_modelo_medico(),
        criar_modelo_medico(),
        criar_modelo_medico(),
    ]
    session.scalars.return_value.all.return_value = medicos_retornados

    medicos, proximo_id = listar_medico(session, limit=2)

    assert medicos == medicos_retornados[:2]
    assert proximo_id == medicos_retornados[1].id


def test_listar_medicos_aplica_cursor_na_consulta() -> None:
    session = MagicMock(spec=Session)
    cursor_id = uuid.uuid4()
    session.scalars.return_value.all.return_value = []

    medicos, proximo_id = listar_medico(session, cursor_id=cursor_id)

    assert medicos == []
    assert proximo_id is None
    statement = session.scalars.call_args.args[0]
    assert cursor_id in statement.compile().params.values()


@pytest.mark.parametrize(
    ("limit", "limite_sql"),
    [(0, 2), (101, 101)],
)
def test_listar_medicos_limita_tamanho_da_pagina(
    limit: int,
    limite_sql: int,
) -> None:
    session = MagicMock(spec=Session)
    session.scalars.return_value.all.return_value = []

    listar_medico(session, limit=limit)

    statement = session.scalars.call_args.args[0]
    sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert f"LIMIT {limite_sql}" in sql
