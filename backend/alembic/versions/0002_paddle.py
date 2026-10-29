"""Add Paddle Billing columns.

Revision ID: 0002_paddle
Revises: 0001_initial
Create Date: 2026-01-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_paddle"
down_revision: str | Sequence[str] | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("paddle_product_id", sa.String(), nullable=True))
    op.add_column("plans", sa.Column("paddle_price_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("paddle_customer_id", sa.String(), nullable=True))

    op.execute("ALTER TYPE paymentprovider ADD VALUE IF NOT EXISTS 'PADDLE'")


def downgrade() -> None:
    op.drop_column("users", "paddle_customer_id")
    op.drop_column("plans", "paddle_price_id")
    op.drop_column("plans", "paddle_product_id")
