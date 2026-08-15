import uuid
from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy.dialects.postgresql import insert

from app.database import SessionLocal
from app.models import Agendamento, Client, Especialidade, Horario, Medico
from app.models.agendamento import CancelamentoOrigem, StatusAgendamento
from app.models.medico_especialidade import tabela_medico_especialidade

SEED_NAMESPACE = uuid.UUID("2fdad40b-e46b-4e94-9f57-ae1884150550")
FUSO_HORARIO = ZoneInfo("America/Fortaleza")

ESPECIALIDADES = [
    "Cardiologia",
    "Dermatologia",
    "Endocrinologia",
    "Ginecologia",
    "Ortopedia",
    "Clínica médica",
]

MEDICOS = [
    ("Dra. Mariana Alves", ["Cardiologia", "Clínica médica"]),
    ("Dr. Rafael Monteiro", ["Dermatologia"]),
    ("Dra. Lúcia Fernandes", ["Endocrinologia", "Clínica médica"]),
    ("Dr. Caio Vasconcelos", ["Ortopedia"]),
    ("Dra. Patrícia Gomes", ["Ginecologia"]),
]

CLIENTES = [
    (
        "Ana Paula Ribeiro",
        "(85) 98841-2030",
        "ana.ribeiro@email.com",
        "1987-03-12",
    ),
    (
        "Bruno Henrique Lima",
        "(85) 99620-1147",
        "bruno.lima@email.com",
        "1992-09-25",
    ),
    (
        "Carla Mendes Nogueira",
        "(85) 99175-8820",
        "carla.nogueira@email.com",
        "1978-06-07",
    ),
    (
        "Daniel Oliveira Costa",
        "(85) 98712-4406",
        "daniel.costa@email.com",
        "1984-11-18",
    ),
    (
        "Elisa Martins Rocha",
        "(85) 99461-0953",
        "elisa.rocha@email.com",
        "1998-01-30",
    ),
    ("Fábio Sousa Almeida", "(85) 99222-7314", None, "1969-08-14"),
    (
        "Gabriela Freitas Melo",
        "(85) 98903-5571",
        "gabriela.melo@email.com",
        "1995-04-22",
    ),
    (
        "Helena Barros Cavalcante",
        "(85) 99730-6182",
        "helena.cavalcante@email.com",
        "1956-12-03",
    ),
]

HORARIOS = [
    (
        "h1",
        "Dra. Mariana Alves",
        "2027-08-10T08:00:00",
        "2027-08-10T09:00:00",
        True,
    ),
    (
        "h2",
        "Dra. Mariana Alves",
        "2027-08-10T09:00:00",
        "2027-08-10T10:00:00",
        True,
    ),
    (
        "h3",
        "Dr. Rafael Monteiro",
        "2027-08-10T09:00:00",
        "2027-08-10T10:00:00",
        True,
    ),
    (
        "h4",
        "Dra. Lúcia Fernandes",
        "2027-08-10T10:00:00",
        "2027-08-10T11:00:00",
        True,
    ),
    (
        "h5",
        "Dr. Caio Vasconcelos",
        "2027-08-10T10:00:00",
        "2027-08-10T11:00:00",
        True,
    ),
    (
        "h6",
        "Dra. Patrícia Gomes",
        "2027-08-10T13:00:00",
        "2027-08-10T14:00:00",
        False,
    ),
    (
        "h7",
        "Dra. Mariana Alves",
        "2027-08-05T15:00:00",
        "2027-08-05T16:00:00",
        True,
    ),
    (
        "h8",
        "Dr. Rafael Monteiro",
        "2027-08-11T08:00:00",
        "2027-08-11T09:00:00",
        True,
    ),
    (
        "h9",
        "Dra. Lúcia Fernandes",
        "2027-08-11T09:00:00",
        "2027-08-11T10:00:00",
        True,
    ),
    (
        "h10",
        "Dr. Caio Vasconcelos",
        "2027-08-11T14:00:00",
        "2027-08-11T15:00:00",
        True,
    ),
    (
        "h11",
        "Dra. Patrícia Gomes",
        "2027-08-05T11:00:00",
        "2027-08-05T12:00:00",
        True,
    ),
    (
        "h12",
        "Dr. Rafael Monteiro",
        "2027-08-12T08:00:00",
        "2027-08-12T09:00:00",
        True,
    ),
    (
        "h13",
        "Dra. Lúcia Fernandes",
        "2027-08-13T16:00:00",
        "2027-08-13T17:00:00",
        True,
    ),
]

AGENDAMENTOS = [
    ("a1", "Ana Paula Ribeiro", "h1", StatusAgendamento.AGENDADO),
    ("a2", "Bruno Henrique Lima", "h3", StatusAgendamento.AGENDADO),
    ("a3", "Carla Mendes Nogueira", "h4", StatusAgendamento.AGENDADO),
    ("a4", "Daniel Oliveira Costa", "h10", StatusAgendamento.AGENDADO),
    ("a5", "Elisa Martins Rocha", "h11", StatusAgendamento.AGENDADO),
    ("a6", "Fábio Sousa Almeida", "h7", StatusAgendamento.AGENDADO),
    ("a7", "Gabriela Freitas Melo", "h12", StatusAgendamento.CANCELADO),
    ("a8", "Helena Barros Cavalcante", "h13", StatusAgendamento.CANCELADO),
]


def executar_seed() -> None:
    especialidade_ids = {
        nome: uuid.uuid5(SEED_NAMESPACE, f"especialidade:{nome}")
        for nome in ESPECIALIDADES
    }
    medico_ids = {
        nome: uuid.uuid5(SEED_NAMESPACE, f"medico:{nome}") for nome, _ in MEDICOS
    }
    cliente_ids = {
        nome: uuid.uuid5(SEED_NAMESPACE, f"cliente:{nome}")
        for nome, _, _, _ in CLIENTES
    }
    horario_ids = {
        codigo: uuid.uuid5(SEED_NAMESPACE, f"horario:{codigo}")
        for codigo, _, _, _, _ in HORARIOS
    }

    with SessionLocal.begin() as session:
        session.execute(
            insert(Especialidade)
            .values(
                [
                    {"id": especialidade_ids[nome], "nome": nome, "active": True}
                    for nome in ESPECIALIDADES
                ]
            )
            .on_conflict_do_update(
                index_elements=[Especialidade.id],
                set_={"nome": insert(Especialidade).excluded.nome, "active": True},
            )
        )
        session.execute(
            insert(Medico)
            .values(
                [
                    {"id": medico_ids[nome], "nome": nome, "active": True}
                    for nome, _ in MEDICOS
                ]
            )
            .on_conflict_do_update(
                index_elements=[Medico.id],
                set_={"nome": insert(Medico).excluded.nome, "active": True},
            )
        )
        session.execute(
            insert(tabela_medico_especialidade)
            .values(
                [
                    {
                        "medico_id": medico_ids[medico],
                        "especialidade_id": especialidade_ids[especialidade],
                    }
                    for medico, especialidades in MEDICOS
                    for especialidade in especialidades
                ]
            )
            .on_conflict_do_nothing()
        )
        session.execute(
            insert(Client)
            .values(
                [
                    {
                        "id": cliente_ids[nome],
                        "nome": nome,
                        "telefone": telefone,
                        "email": email,
                        "data_nascimento": date.fromisoformat(data_nascimento),
                    }
                    for nome, telefone, email, data_nascimento in CLIENTES
                ]
            )
            .on_conflict_do_update(
                index_elements=[Client.id],
                set_={
                    "nome": insert(Client).excluded.nome,
                    "telefone": insert(Client).excluded.telefone,
                    "email": insert(Client).excluded.email,
                    "data_nascimento": insert(Client).excluded.data_nascimento,
                },
            )
        )
        session.execute(
            insert(Horario)
            .values(
                [
                    {
                        "id": horario_ids[codigo],
                        "medico_id": medico_ids[medico],
                        "inicio": datetime.fromisoformat(inicio).replace(
                            tzinfo=FUSO_HORARIO
                        ),
                        "fim": datetime.fromisoformat(fim).replace(
                            tzinfo=FUSO_HORARIO
                        ),
                        "ativo": ativo,
                    }
                    for codigo, medico, inicio, fim, ativo in HORARIOS
                ]
            )
            .on_conflict_do_update(
                index_elements=[Horario.id],
                set_={
                    "medico_id": insert(Horario).excluded.medico_id,
                    "inicio": insert(Horario).excluded.inicio,
                    "fim": insert(Horario).excluded.fim,
                    "ativo": insert(Horario).excluded.ativo,
                },
            )
        )
        session.execute(
            insert(Agendamento)
            .values(
                [
                    {
                        "id": uuid.uuid5(SEED_NAMESPACE, f"agendamento:{codigo}"),
                        "cliente_id": cliente_ids[cliente],
                        "horario_id": horario_ids[horario],
                        "status": status,
                        "criado_em": datetime(
                            2026, 8, 3, 14, 32, tzinfo=FUSO_HORARIO
                        ),
                        "cancelado_por": (
                            CancelamentoOrigem.CLIENTE
                            if status is StatusAgendamento.CANCELADO
                            else None
                        ),
                        "cancelado_em": (
                            datetime(2026, 8, 3, 14, 32, tzinfo=FUSO_HORARIO)
                            if status is StatusAgendamento.CANCELADO
                            else None
                        ),
                    }
                    for codigo, cliente, horario, status in AGENDAMENTOS
                ]
            )
            .on_conflict_do_update(
                index_elements=[Agendamento.id],
                set_={
                    "cliente_id": insert(Agendamento).excluded.cliente_id,
                    "horario_id": insert(Agendamento).excluded.horario_id,
                    "status": insert(Agendamento).excluded.status,
                    "criado_em": insert(Agendamento).excluded.criado_em,
                    "cancelado_por": insert(Agendamento).excluded.cancelado_por,
                    "cancelado_em": insert(Agendamento).excluded.cancelado_em,
                },
            )
        )


if __name__ == "__main__":
    executar_seed()
