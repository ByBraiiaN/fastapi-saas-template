from datetime import UTC, datetime
from enum import Enum
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy import Enum as SAENUM
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Provider(str, Enum):
    GOOGLE = "google"
    GITHUB = "github"
    LOCAL = "local"


class User(Base):
    __tablename__ = "users"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False) 
    password: Mapped[str] = mapped_column(String(255), nullable=True) #nullable true for social login 
    is_admin: Mapped[bool] = mapped_column(Boolean(), default=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True) 
    is_verified: Mapped[bool] = mapped_column(Boolean(), default=False) 
    stripe_customer_id: Mapped[str] = mapped_column(String(), nullable=True)  # legacy, use paddle_customer_id
    paddle_customer_id: Mapped[str] = mapped_column(String(), nullable=True)
    provider: Mapped[Provider] = mapped_column(SAENUM(Provider), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                    default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                default=lambda: datetime.now(UTC),onupdate=lambda: datetime.now(UTC))
    
    subscriptions = relationship("Subscription", back_populates="user")
    transactions = relationship("Payment", back_populates="user")


class LoginCode(Base):
    __tablename__ = 'login_codes'

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    code_hash: Mapped[str] = mapped_column(String(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                    default=lambda: datetime.now(UTC))

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )


    