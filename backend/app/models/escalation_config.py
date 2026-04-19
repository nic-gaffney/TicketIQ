from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EscalationConfig(Base):
    """Singleton-style row (id=1) for MVP escalation rules (FR-40–FR-46)."""

    __tablename__ = "escalation_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    high_unassigned_threshold_minutes: Mapped[int] = mapped_column(Integer, default=30)
    job_interval_seconds: Mapped[int] = mapped_column(Integer, default=300)
    notification_target: Mapped[str] = mapped_column(String(255), default="it-manager@example.com")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
