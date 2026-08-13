"""impede agendamentos ativos duplicados

Revision ID: b6e9a43c102f
Revises: a91c7e42d5b8
Create Date: 2026-08-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b6e9a43c102f"
down_revision: str | None = "a91c7e42d5b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_agendamentos_horario_agendado",
        "agendamentos",
        ["horario_id"],
        unique=True,
        postgresql_where=sa.text("status = 'AGENDADO'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_agendamentos_horario_agendado",
        table_name="agendamentos",
    )
