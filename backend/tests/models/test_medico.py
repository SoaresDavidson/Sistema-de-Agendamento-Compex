from sqlalchemy import Boolean, DateTime, String, Uuid

from app.models.medico import Medico
from app.models.medico_especialidade import tabela_medico_especialidade


def test_modelo_medico_possui_campos_esperados() -> None:
    colunas = Medico.__table__.columns

    assert set(colunas.keys()) == {
        "id",
        "nome",
        "active",
        "created_at",
    }


def test_id_do_medico_e_uuid_e_chave_primaria() -> None:
    medico_id = Medico.__table__.columns.id

    assert isinstance(medico_id.type, Uuid)
    assert medico_id.type.as_uuid is True
    assert medico_id.primary_key is True
    assert medico_id.nullable is False
    assert medico_id.server_default is not None
    assert str(medico_id.server_default.arg) == "gen_random_uuid()"


def test_nome_do_medico_e_obrigatorio_e_limitado() -> None:
    nome = Medico.__table__.columns.nome

    assert isinstance(nome.type, String)
    assert nome.type.length == 255
    assert nome.nullable is False


def test_medico_possui_campos_de_atividade_e_criacao() -> None:
    active = Medico.__table__.columns.active
    created_at = Medico.__table__.columns.created_at

    assert isinstance(active.type, Boolean)
    assert active.nullable is False
    assert active.server_default is not None
    assert str(active.server_default.arg) == "true"
    assert isinstance(created_at.type, DateTime)
    assert created_at.nullable is False
    assert created_at.server_default is not None
    assert str(created_at.server_default.arg) == "now()"


def test_medico_usa_tabela_associativa_para_especialidades() -> None:
    relacionamento = Medico.especialidades.property

    assert relacionamento.secondary is tabela_medico_especialidade
    assert relacionamento.mapper.class_.__name__ == "Especialidade"


def test_associacao_possui_chave_primaria_composta() -> None:
    nomes_chave_primaria = {
        coluna.name for coluna in tabela_medico_especialidade.primary_key.columns
    }

    assert nomes_chave_primaria == {"medico_id", "especialidade_id"}
    assert all(
        coluna.nullable is False for coluna in tabela_medico_especialidade.columns
    )


def test_associacao_possui_foreign_keys_com_cascade() -> None:
    foreign_keys = {
        foreign_key.parent.name: foreign_key
        for foreign_key in tabela_medico_especialidade.foreign_keys
    }

    assert foreign_keys["medico_id"].target_fullname == "medicos.id"
    assert foreign_keys["medico_id"].ondelete == "CASCADE"
    assert (
        foreign_keys["especialidade_id"].target_fullname == "especialidades.id"
    )
    assert foreign_keys["especialidade_id"].ondelete == "CASCADE"
