import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class TicketStatus(enum.StrEnum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    escalated = "escalated"


class Severity(enum.StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class Urgency(enum.StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(Text)
    affected_system: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(64), index=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus), default=TicketStatus.open, index=True)
    severity: Mapped[Severity] = mapped_column(Enum(Severity), default=Severity.low, index=True)
    urgency: Mapped[Urgency] = mapped_column(Enum(Urgency), default=Urgency.low, index=True)
    priority_score: Mapped[int] = mapped_column(Integer, default=0, index=True)

    submitted_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    resolution_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    escalated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    submitter: Mapped["User"] = relationship(foreign_keys=[submitted_by_id], back_populates="tickets_submitted")
    assignee: Mapped["User | None"] = relationship(foreign_keys=[assigned_to_id], back_populates="tickets_assigned")
