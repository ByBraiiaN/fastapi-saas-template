from datetime import UTC, datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    jti: Mapped[str] = mapped_column(String(), nullable=False, unique=True)
    token_hash: Mapped[str] = mapped_column(String(), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                    default=lambda: datetime.now(UTC))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    revoked: Mapped[bool] = mapped_column(Boolean(), default=False)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    replaced_by_jti: Mapped[str] = mapped_column(String(), nullable=True)

    user = relationship("User", backref="refresh_tokens")

    