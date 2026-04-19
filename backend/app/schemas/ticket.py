from datetime import datetime

from pydantic import BaseModel, Field

from app.models.ticket import Severity, TicketStatus, Urgency
from app.schemas.auth import UserPublic


class TicketCreate(BaseModel):
    description: str = Field(min_length=10)
    affected_system: str = Field(min_length=2)
    category: str = Field(min_length=2)
    region: str | None = None


class TicketUpdateTech(BaseModel):
    status: TicketStatus | None = None
    internal_notes: str | None = None
    resolution_summary: str | None = None


class TicketAssign(BaseModel):
    assignee_id: int


class TicketAdminOverride(BaseModel):
    severity: Severity | None = None
    urgency: Urgency | None = None
    status: TicketStatus | None = None
    assigned_to_id: int | None = Field(
        default=None,
        description="Set assignee user id; omit field to leave unchanged; null clears assignment",
    )


class TicketOut(BaseModel):
    id: int
    description: str
    affected_system: str
    category: str
    region: str | None
    status: TicketStatus
    severity: Severity
    urgency: Urgency
    priority_score: int
    submitted_by_id: int
    assigned_to_id: int | None
    internal_notes: str | None = None
    attachment_path: str | None = None
    resolution_summary: str | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    escalated_at: datetime | None
    submitter: UserPublic | None = None
    assignee: UserPublic | None = None
    model_config = {"from_attributes": True}


class EscalationConfigOut(BaseModel):
    id: int
    high_unassigned_threshold_minutes: int
    job_interval_seconds: int
    notification_target: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class EscalationConfigUpdate(BaseModel):
    high_unassigned_threshold_minutes: int | None = Field(default=None, ge=1, le=1440)
    job_interval_seconds: int | None = Field(default=None, ge=60, le=3600)
    notification_target: str | None = None


class AuditLogOut(BaseModel):
    id: int
    ticket_id: int
    actor_user_id: int | None
    actor_label: str
    action: str
    payload: dict
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
