import uuid
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models.especialidade import Especialidade
from app.schemas.especialidade import EspecialidadeUpdate
from app.services import especialidade as especialidade_service
from app.services.especialidade import (
    EspecialidadeDuplicada,
    EspecialidadeNaoEncontrada,
    atualizar_especialidade_service,
)


def criar_especialidade(nome: str = "Cardiologia") -> Especialidade:
    return Especialidade(id=uuid.uuid4(), nome=nome)


def test_atualizar_busca_por_id_exclui_proprio_id_e_delega_atualizacao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    especialidade = criar_especialidade()
    payload = EspecialidadeUpdate(nome="Cardiologia Pediátrica")
    buscar_por_id = MagicMock(return_value=especialidade)
    buscar_duplicada = MagicMock(return_value=None)
    atualizar = MagicMock(return_value=especialidade)
    monkeypatch.setattr(
        especialidade_service, "buscar_especialidade_por_id", buscar_por_id
    )
    monkeypatch.setattr(
        especialidade_service,
        "buscar_especialidade_por_nome_normalizado",
        buscar_duplicada,
    )
    monkeypatch.setattr(especialidade_service, "atualizar_especialidade", atualizar)

    resultado = atualizar_especialidade_service(session, especialidade.id, payload)

    assert resultado is especialidade
    buscar_por_id.assert_called_once_with(session, especialidade.id)
    buscar_duplicada.assert_called_once_with(
        session,
        "Cardiologia Pediátrica",
        especialidade_id_excluido=especialidade.id,
    )
    atualizar.assert_called_once_with(session, especialidade, payload)


def test_atualizar_id_inexistente_interrompe_antes_da_busca_de_duplicidade(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    especialidade_id = uuid.uuid4()
    buscar_duplicada = MagicMock()
    atualizar = MagicMock()
    monkeypatch.setattr(
        especialidade_service,
        "buscar_especialidade_por_id",
        MagicMock(return_value=None),
    )
    monkeypatch.setattr(
        especialidade_service,
        "buscar_especialidade_por_nome_normalizado",
        buscar_duplicada,
    )
    monkeypatch.setattr(especialidade_service, "atualizar_especialidade", atualizar)

    with pytest.raises(EspecialidadeNaoEncontrada, match="não encontrada"):
        atualizar_especialidade_service(
            session,
            especialidade_id,
            EspecialidadeUpdate(nome="Cardiologia"),
        )

    buscar_duplicada.assert_not_called()
    atualizar.assert_not_called()


def test_atualizar_rejeita_nome_normalizado_de_outro_registro(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session = MagicMock(spec=Session)
    especialidade = criar_especialidade("Cardiologia")
    duplicada = criar_especialidade("Clínica Médica")
    atualizar = MagicMock()
    monkeypatch.setattr(
        especialidade_service,
        "buscar_especialidade_por_id",
        MagicMock(return_value=especialidade),
    )
    monkeypatch.setattr(
        especialidade_service,
        "buscar_especialidade_por_nome_normalizado",
        MagicMock(return_value=duplicada),
    )
    monkeypatch.setattr(especialidade_service, "atualizar_especialidade", atualizar)

    with pytest.raises(EspecialidadeDuplicada, match="já cadastrada"):
        atualizar_especialidade_service(
            session,
            especialidade.id,
            EspecialidadeUpdate(nome="CLÍNICA MÉDICA"),
        )

    atualizar.assert_not_called()
