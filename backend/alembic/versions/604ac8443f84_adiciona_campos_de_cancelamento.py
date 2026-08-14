"""adiciona_campos_de_cancelamento

Revision ID: 604ac8443f84
Revises: b6e9a43c102f
Create Date: 2026-08-13 20:57:52.400795
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "604ac8443f84"
down_revision: str | None = "b6e9a43c102f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


cancelamento_origem = postgresql.ENUM(
    "CLIENTE",
    "MEDICO",
    name="cancelamento_origem",
    create_type=False,
)


def upgrade() -> None:
    cancelamento_origem.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "agendamentos",
        sa.Column("cancelado_por", cancelamento_origem, nullable=True),
    )
    op.add_column(
        "agendamentos",
        sa.Column("cancelado_em", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "agendamentos",
        sa.Column("observacao_cancelamento", sa.String(1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("agendamentos", "observacao_cancelamento")
    op.drop_column("agendamentos", "cancelado_em")
    op.drop_column("agendamentos", "cancelado_por")
    cancelamento_origem.drop(op.get_bind(), checkfirst=True)
