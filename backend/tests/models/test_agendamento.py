from sqlalchemy import DateTime, Enum, Uuid

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.cliente import Client
from app.models.horario import Horario


def test_modelo_possui_campos_esperados() -> None:
    colunas = Agendamento.__table__.columns

    assert set(colunas.keys()) == {
        "id",
        "cliente_id",
        "horario_id",
        "status",
        "criado_em",
    }


def test_cliente_e_horario_sao_obrigatorios() -> None:
    cliente_id = Agendamento.__table__.columns.cliente_id
    horario_id = Agendamento.__table__.columns.horario_id
    chave_cliente = next(iter(cliente_id.foreign_keys))
    chave_horario = next(iter(horario_id.foreign_keys))

    assert isinstance(cliente_id.type, Uuid)
    assert isinstance(horario_id.type, Uuid)
    assert cliente_id.nullable is False
    assert horario_id.nullable is False
    assert chave_cliente.target_fullname == "clientes.id"
    assert chave_horario.target_fullname == "horarios.id"
    assert chave_cliente.ondelete is None
    assert chave_horario.ondelete is None


def test_status_possui_valores_persistidos_e_padrao_agendado() -> None:
    status = Agendamento.__table__.columns.status

    assert isinstance(status.type, Enum)
    assert status.type.name == "status_agendamento"
    assert status.type.enums == ["AGENDADO", "CANCELADO"]
    assert status.nullable is False
    assert status.default is not None
    assert status.default.arg is StatusAgendamento.AGENDADO
    assert status.server_default is not None
    assert str(status.server_default.arg) == "AGENDADO"
    assert "CONCLUIDO" not in status.type.enums


def test_indice_unico_restringe_apenas_agendamentos_ativos() -> None:
    indice = next(
        indice
        for indice in Agendamento.__table__.indexes
        if indice.name == "uq_agendamentos_horario_agendado"
    )

    assert indice.unique is True
    assert [expressao.name for expressao in indice.expressions] == ["horario_id"]
    assert str(indice.dialect_options["postgresql"]["where"]) == ("status = 'AGENDADO'")


def test_criado_em_e_obrigatorio_e_possui_fuso_horario() -> None:
    criado_em = Agendamento.__table__.columns.criado_em

    assert isinstance(criado_em.type, DateTime)
    assert criado_em.type.timezone is True
    assert criado_em.nullable is False
    assert criado_em.default is not None
    assert criado_em.server_default is not None
    assert str(criado_em.server_default.arg) == "now()"


def test_relacionamentos_sao_bidirecionais() -> None:
    relacionamento_cliente = Agendamento.cliente.property
    relacionamento_horario = Agendamento.horario.property
    relacionamento_agendamentos_cliente = Client.agendamentos.property
    relacionamento_agendamentos_horario = Horario.agendamentos.property

    assert relacionamento_cliente.mapper.class_ is Client
    assert relacionamento_cliente.back_populates == "agendamentos"
    assert relacionamento_horario.mapper.class_ is Horario
    assert relacionamento_horario.back_populates == "agendamentos"
    assert relacionamento_agendamentos_cliente.mapper.class_ is Agendamento
    assert relacionamento_agendamentos_cliente.back_populates == "cliente"
    assert relacionamento_agendamentos_horario.mapper.class_ is Agendamento
    assert relacionamento_agendamentos_horario.back_populates == "horario"
