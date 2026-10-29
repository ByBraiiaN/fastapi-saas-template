"""Initial schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

provider_enum = postgresql.ENUM("GOOGLE", "GITHUB", "LOCAL", name="provider", create_type=False)
billing_period_enum = postgresql.ENUM("MONTHLY", "YEARLY", name="billingperiod", create_type=False)
subscription_status_enum = postgresql.ENUM(
    "ACTIVE", "TRIALING", "PENDING", "CANCELED", "PAST_DUE",
    name="subscriptionstatus", create_type=False,
)
payment_status_enum = postgresql.ENUM("SUCCEEDED", "PENDING", "FAILED", name="paymentstatus", create_type=False)
payment_provider_enum = postgresql.ENUM("MANUAL", "STRIPE", "PAYMOB", name="paymentprovider", create_type=False)
plan_tier_enum = postgresql.ENUM("FREE", "PRO", "VIP", name="plantier", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum_type in (
        provider_enum,
        billing_period_enum,
        subscription_status_enum,
        payment_status_enum,
        payment_provider_enum,
        plan_tier_enum,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("stripe_customer_id", sa.String(), nullable=True),
        sa.Column("provider", provider_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("jti", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_jti", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti"),
    )

    op.create_table(
        "login_codes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "plans",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default=sa.text("'USD'")),
        sa.Column("billing_period", billing_period_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("stripe_product_id", sa.String(), nullable=True),
        sa.Column("stripe_price_id", sa.String(), nullable=True),
        sa.Column("tier", plan_tier_enum, nullable=False, server_default=sa.text("'FREE'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("plan_id", sa.UUID(), nullable=False),
        sa.Column("status", subscription_status_enum, nullable=False),
        sa.Column("provider", payment_provider_enum, nullable=False),
        sa.Column("provider_subscription_id", sa.String(), nullable=True),
        sa.Column("provider_customer_id", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_subscription_id"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=False)
    op.create_index("ix_subscriptions_plan_id", "subscriptions", ["plan_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("subscription_id", sa.UUID(), nullable=True),
        sa.Column("provider", payment_provider_enum, nullable=False),
        sa.Column("provider_invoice_id", sa.String(), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default=sa.text("'USD'")),
        sa.Column("status", payment_status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_invoice_id", name="uq_provider_invoice_id"),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"], unique=False)
    op.create_index("ix_payments_provider_invoice_id", "payments", ["provider_invoice_id"], unique=False)

    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("admin_id", sa.UUID(), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("before", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_logs_admin_id", "admin_audit_logs", ["admin_id"], unique=False)
    op.create_index("ix_admin_audit_logs_target_type", "admin_audit_logs", ["target_type"], unique=False)
    op.create_index("ix_admin_audit_logs_target_id", "admin_audit_logs", ["target_id"], unique=False)
    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"], unique=False)
    op.create_index(
        "ix_admin_audit_target",
        "admin_audit_logs",
        ["target_type", "target_id"],
        unique=False,
    )
    op.create_index(
        "ix_admin_audit_admin_action",
        "admin_audit_logs",
        ["admin_id", "action"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("admin_audit_logs")
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("plans")
    op.drop_table("login_codes")
    op.drop_table("refresh_tokens")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_type in (
        plan_tier_enum,
        payment_provider_enum,
        payment_status_enum,
        subscription_status_enum,
        billing_period_enum,
        provider_enum,
    ):
        enum_type.drop(bind, checkfirst=True)
