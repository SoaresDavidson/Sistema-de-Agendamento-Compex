from sqlalchemy import Boolean, DateTime, String, Uuid

from app.models.especialidade import Especialidade


def test_modelo_especialidade_possui_campos_esperados() -> None:
    colunas = Especialidade.__table__.columns

    assert set(colunas.keys()) == {
        "id",
        "nome",
        "active",
        "created_at",
    }


def test_id_da_especialidade_e_uuid_e_chave_primaria() -> None:
    especialidade_id = Especialidade.__table__.columns.id

    assert isinstance(especialidade_id.type, Uuid)
    assert especialidade_id.type.as_uuid is True
    assert especialidade_id.primary_key is True
    assert especialidade_id.nullable is False
    assert especialidade_id.server_default is not None
    assert str(especialidade_id.server_default.arg) == "gen_random_uuid()"


def test_nome_da_especialidade_e_obrigatorio_e_limitado() -> None:
    nome = Especialidade.__table__.columns.nome

    assert isinstance(nome.type, String)
    assert nome.type.length == 255
    assert nome.nullable is False
    assert nome.unique is True


def test_especialidade_possui_campos_de_atividade_e_criacao() -> None:
    active = Especialidade.__table__.columns.active
    created_at = Especialidade.__table__.columns.created_at

    assert isinstance(active.type, Boolean)
    assert active.nullable is False
    assert active.server_default is not None
    assert str(active.server_default.arg) == "true"
    assert isinstance(created_at.type, DateTime)
    assert created_at.nullable is False
    assert created_at.server_default is not None
    assert str(created_at.server_default.arg) == "now()"
