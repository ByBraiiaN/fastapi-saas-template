from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    admin_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    target_type: Mapped[str] = mapped_column(String(50), nullable=False, index= True)
    target_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable= False, index= True)


    action: Mapped[str] = mapped_column(String(50), nullable= False, index= True)

    before: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                    default=lambda: datetime.now(UTC))
    

Index("ix_admin_audit_target", AdminAuditLog.target_type, AdminAuditLog.target_id)
Index("ix_admin_audit_admin_action", AdminAuditLog.admin_id, AdminAuditLog.action)