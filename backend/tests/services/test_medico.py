import uuid
from unittest.mock import MagicMock

import pytest
from app.models.especialidade import Especialidade
from sqlalchemy.orm import Session

from app.models.medico import Medico
from app.schemas.medico import MedicoCreate
from app.services import medico as medico_service
from app.services.medico import (
    MedicoSemEspecialidade,
    cadastrar_medico_service,
    listar_medicos_service,
)


def criar_payload() -> MedicoCreate:
    return MedicoCreate(
        nome="Dra. Mariana Alves",
        especialidades_id=[uuid.uuid4()],
    )


def criar_medico() -> Medico:
    especialidade = Especialidade(
        id=uuid.uuid4(),
        nome="Cardiologia",
    )
    return Medico(
        id=uuid.uuid4(),
        nome="Dra. Mariana Alves",
        especialidades=[especialidade],
    )


def test_cadastrar_medico_delega_para_repository(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload()
    medico = criar_medico()
    criar = MagicMock(return_value=medico)
    monkeypatch.setattr(medico_service, "criar_medico", criar)

    resultado = cadastrar_medico_service(session, payload)

    assert resultado is medico
    criar.assert_called_once_with(session, payload)


def test_cadastrar_medico_rejeita_lista_de_especialidades_vazia() -> None:
    session = MagicMock(spec=Session)
    payload = criar_payload().model_copy(update={"especialidades_id": []})

    with pytest.raises(MedicoSemEspecialidade):
        cadastrar_medico_service(session, payload)


def test_listar_medicos_delega_filtros_e_serializa_cursor(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    cursor = uuid.uuid4()
    proximo_cursor = uuid.uuid4()
    especialidade_id = uuid.uuid4()
    medicos = [criar_medico()]
    listar = MagicMock(return_value=(medicos, proximo_cursor))
    monkeypatch.setattr(medico_service, "listar_medico", listar)

    resultado = listar_medicos_service(
        session,
        cursor,
        10,
        "Mariana",
        especialidade_id,
    )

    assert [item.id for item in resultado.items] == [medico.id for medico in medicos]
    assert resultado.items[0].nome == medicos[0].nome
    assert resultado.next_cursor == str(proximo_cursor)
    listar.assert_called_once_with(
        session,
        cursor,
        10,
        "Mariana",
        especialidade_id,
    )


def test_listar_medicos_sem_resultados_retorna_lista_vazia(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    listar = MagicMock(return_value=([], None))
    monkeypatch.setattr(medico_service, "listar_medico", listar)

    resultado = listar_medicos_service(MagicMock(spec=Session), None, 20)

    assert resultado.items == []
    assert resultado.next_cursor is None
