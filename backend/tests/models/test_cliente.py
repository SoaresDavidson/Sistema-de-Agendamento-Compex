import uuid

from sqlalchemy import CheckConstraint, Date, UniqueConstraint

from app.models.cliente import Client


def test_modelo_possui_campos_esperados() -> None:
    colunas = Client.__table__.columns

    assert set(colunas.keys()) == {
        "id",
        "nome",
        "telefone",
        "email",
        "data_nascimento",
    }


def test_id_e_uuid_com_defaults() -> None:
    id_cliente = Client.__table__.columns.id

    assert id_cliente.primary_key is True
    assert id_cliente.nullable is False
    assert id_cliente.type.as_uuid is True
    assert id_cliente.default is not None
    assert isinstance(id_cliente.default.arg(None), uuid.UUID)
    assert id_cliente.server_default is not None
    assert str(id_cliente.server_default.arg) == "gen_random_uuid()"


def test_campos_obrigatorios_e_email_opcional() -> None:
    colunas = Client.__table__.columns

    assert colunas.nome.nullable is False
    assert colunas.telefone.nullable is False
    assert colunas.data_nascimento.nullable is False
    assert colunas.email.nullable is True
    assert colunas.nome.type.length == 255
    assert colunas.telefone.type.length == 255
    assert colunas.email.type.length == 255


def test_data_nascimento_usa_date_e_rejeita_futura() -> None:
    data_nascimento = Client.__table__.columns.data_nascimento
    restricoes = {
        restricao.name: str(restricao.sqltext)
        for restricao in Client.__table__.constraints
        if isinstance(restricao, CheckConstraint)
    }

    assert isinstance(data_nascimento.type, Date)
    assert (
        restricoes["ck_cliente_data_nascimento_nao_futura"]
        == "data_nascimento <= CURRENT_DATE"
    )


def test_indice_de_duplicidade_nao_e_unico() -> None:
    indice = next(
        indice
        for indice in Client.__table__.indexes
        if indice.name == "ix_clientes_nome_data_nascimento"
    )

    assert [coluna.name for coluna in indice.columns] == [
        "nome",
        "data_nascimento",
    ]
    assert indice.unique is False


def test_nome_e_data_nascimento_nao_possuem_unique_constraint() -> None:
    restricoes_unicas = [
        restricao
        for restricao in Client.__table__.constraints
        if isinstance(restricao, UniqueConstraint)
    ]

    assert restricoes_unicas == []
