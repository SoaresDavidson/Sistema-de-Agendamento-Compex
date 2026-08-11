import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.repositories.horario import (
    buscar_horario_por_id,
    criar_horario,
    listar_horarios,
)
from app.schemas.horario import HorarioCreate

pytestmark = pytest.mark.integration


def test_cria_e_consulta_horario_no_postgres(
    banco_postgres: tuple[Session, uuid.UUID],
) -> None:
    session, medico_id = banco_postgres
    inicio = datetime.now(UTC) + timedelta(days=1)
    dados = HorarioCreate(
        medico_id=medico_id,
        inicio=inicio,
        fim=inicio + timedelta(hours=1),
    )

    horario_criado = criar_horario(session, dados)
    horario_id = horario_criado.id
    session.expunge_all()

    horario_encontrado = buscar_horario_por_id(session, horario_id)
    horarios = listar_horarios(session)

    assert horario_encontrado is not None
    assert horario_encontrado.id == horario_id
    assert horario_encontrado.medico_id == medico_id
    assert horario_encontrado.inicio == inicio
    assert horario_encontrado.fim == dados.fim
    assert horario_encontrado.ativo is True
    assert [horario.id for horario in horarios] == [horario_id]
