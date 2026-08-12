from sqlalchemy import CheckConstraint

from app.models.horario import Horario
from app.models.medico import Medico


def test_modelo_possui_campos_esperados() -> None:
    colunas = Horario.__table__.columns

    assert set(colunas.keys()) == {
        "id",
        "medico_id",
        "inicio",
        "fim",
        "ativo",
    }
    assert "disponivel" not in colunas


def test_medico_e_obrigatorio() -> None:
    medico_id = Horario.__table__.columns.medico_id
    chave_estrangeira = next(iter(medico_id.foreign_keys))

    assert medico_id.nullable is False
    assert chave_estrangeira.target_fullname == "medicos.id"


def test_horario_e_medico_possuem_relacionamento_bidirecional() -> None:
    relacionamento_medico = Horario.medico.property
    relacionamento_horarios = Medico.horarios.property

    assert relacionamento_medico.mapper.class_ is Medico
    assert relacionamento_medico.back_populates == "horarios"
    assert relacionamento_horarios.mapper.class_ is Horario
    assert relacionamento_horarios.back_populates == "medico"


def test_inicio_e_fim_sao_obrigatorios_e_possuem_fuso_horario() -> None:
    inicio = Horario.__table__.columns.inicio
    fim = Horario.__table__.columns.fim

    assert inicio.nullable is False
    assert fim.nullable is False
    assert inicio.type.timezone is True
    assert fim.type.timezone is True


def test_horario_e_ativo_por_padrao() -> None:
    ativo = Horario.__table__.columns.ativo

    assert ativo.nullable is False
    assert ativo.default is not None
    assert ativo.default.arg is True
    assert ativo.server_default is not None
    assert str(ativo.server_default.arg) == "true"


def test_modelo_restringe_inicio_anterior_ao_fim() -> None:
    restricoes = {
        restricao.name: str(restricao.sqltext)
        for restricao in Horario.__table__.constraints
        if isinstance(restricao, CheckConstraint)
    }

    assert restricoes["ck_horarios_inicio_anterior_fim"] == "inicio < fim"
