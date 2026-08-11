import uuid

import pytest
from pydantic import ValidationError

from app.models.especialidade import Especialidade
from app.schemas.especialidade import (
    EspecialidadeCreate,
    EspecialidadePage,
    EspecialidadeResponse,
)


def test_valida_e_normaliza_nome_da_especialidade() -> None:
    dados = EspecialidadeCreate(nome="  Clínica   Médica  ")

    assert dados.nome == "Clínica Médica"


@pytest.mark.parametrize("nome", [None, "", "   "])
def test_rejeita_nome_ausente_ou_vazio(nome: object) -> None:
    with pytest.raises(ValidationError):
        EspecialidadeCreate.model_validate({"nome": nome})


def test_rejeita_nome_acima_do_limite() -> None:
    with pytest.raises(ValidationError):
        EspecialidadeCreate(nome="a" * 256)


def test_serializa_especialidade_a_partir_do_model() -> None:
    especialidade = Especialidade(id=uuid.uuid4(), nome="Cardiologia")

    resposta = EspecialidadeResponse.model_validate(especialidade)

    assert resposta.id == especialidade.id
    assert resposta.nome == especialidade.nome


def test_serializa_pagina_de_especialidades() -> None:
    item = EspecialidadeResponse(id=uuid.uuid4(), nome="Cardiologia")

    pagina = EspecialidadePage(items=[item], next_cursor=str(item.id))

    assert pagina.items == [item]
    assert pagina.next_cursor == str(item.id)
