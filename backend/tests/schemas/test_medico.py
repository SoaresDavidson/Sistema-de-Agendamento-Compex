import uuid

import pytest
from pydantic import ValidationError

from app.models.especialidade import Especialidade
from app.models.medico import Medico
from app.schemas.medico import MedicoCreate, MedicoResponse


def test_valida_criacao_de_medico() -> None:
    especialidade_id = uuid.uuid4()

    dados = MedicoCreate(
        nome="  Dra. Mariana Alves  ",
        especialidades_id=[especialidade_id],
    )

    assert dados.nome == "Dra. Mariana Alves"
    assert dados.especialidades_id == [especialidade_id]


@pytest.mark.parametrize("nome", ["", "   "])
def test_rejeita_nome_vazio(nome: str) -> None:
    with pytest.raises(ValidationError):
        MedicoCreate(nome=nome, especialidades_id=[uuid.uuid4()])


def test_rejeita_especialidade_invalida() -> None:
    with pytest.raises(ValidationError):
        MedicoCreate.model_validate(
            {
                "nome": "Dra. Mariana Alves",
                "especialidades_id": ["invalida"],
            }
        )


def test_serializa_medico_com_especialidades() -> None:
    especialidade = Especialidade(id=uuid.uuid4(), nome="Cardiologia")
    medico = Medico(
        id=uuid.uuid4(),
        nome="Dra. Mariana Alves",
        especialidades=[especialidade],
    )

    resposta = MedicoResponse.model_validate(medico)

    assert resposta.id == medico.id
    assert resposta.nome == medico.nome
    assert resposta.especialidades[0].id == especialidade.id
    assert resposta.especialidades[0].nome == especialidade.nome
