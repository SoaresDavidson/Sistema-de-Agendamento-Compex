"""adiciona agendamentos

Revision ID: a91c7e42d5b8
Revises: f14b8d6c2a73
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "a91c7e42d5b8"
down_revision: str | None = "f14b8d6c2a73"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

status_agendamento = postgresql.ENUM(
    "AGENDADO",
    "CANCELADO",
    name="status_agendamento",
    create_type=False,
)


def upgrade() -> None:
    status_agendamento.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "agendamentos",
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("cliente_id", sa.Uuid(), nullable=False),
        sa.Column("horario_id", sa.Uuid(), nullable=False),
        sa.Column(
            "status",
            status_agendamento,
            server_default="AGENDADO",
            nullable=False,
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"]),
        sa.ForeignKeyConstraint(["horario_id"], ["horarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("agendamentos")
    status_agendamento.drop(op.get_bind(), checkfirst=True)
