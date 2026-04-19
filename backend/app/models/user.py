import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.ticket import Ticket


class UserRole(enum.StrEnum):
    end_user = "end_user"
    it_support = "it_support"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.end_user)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    department: Mapped[str] = mapped_column(String(128), default="IT Operations")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tickets_submitted: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="Ticket.submitted_by_id",
        back_populates="submitter",
    )
    tickets_assigned: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="Ticket.assigned_to_id",
        back_populates="assignee",
    )
