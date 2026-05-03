import shutil
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, CurrentUser, DBSession, TechOrAdmin
from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.ticket import Severity, Ticket, TicketStatus, Urgency
from app.models.user import User, UserRole
from app.schemas.ticket import (
    TicketAdminOverride,
    TicketAssign,
    TicketOut,
    TicketUpdateTech,
)
from app.services.classification import classify_ticket, compute_priority_score

router = APIRouter()

ALLOWED_CATEGORIES = frozenset(
    {"Network", "Hardware", "Software", "Security", "Access", "Email", "VPN", "Other"}
)


def _archived_condition():
    cutoff = datetime.now(UTC) - timedelta(days=60)
    return (Ticket.status == TicketStatus.resolved) & (Ticket.resolved_at.is_not(None)) & (Ticket.resolved_at <= cutoff)


async def _load_ticket(session, ticket_id: int) -> Ticket | None:
    res = await session.execute(
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(selectinload(Ticket.submitter), selectinload(Ticket.assignee))
    )
    return res.scalar_one_or_none()


def _ticket_to_out(t: Ticket, viewer: User) -> TicketOut:
    data = TicketOut.model_validate(t)
    if viewer.role == UserRole.end_user:
        data = data.model_copy(update={"internal_notes": None})
    return data


@router.get("", response_model=list[TicketOut])
async def list_tickets(
    session: DBSession,
    user: CurrentUser,
    q: str | None = None,
    severity: Severity | None = None,
    urgency: Urgency | None = None,
    status_filter: TicketStatus | None = None,
    category: str | None = None,
    region: str | None = None,
    archived_only: bool = False,
    include_archived: bool = False,
) -> list[TicketOut]:
    stmt = select(Ticket).options(selectinload(Ticket.submitter), selectinload(Ticket.assignee))

    if user.role == UserRole.end_user:
        stmt = stmt.where(Ticket.submitted_by_id == user.id)
    if archived_only:
        stmt = stmt.where(_archived_condition())
    elif not include_archived:
        stmt = stmt.where(~_archived_condition())

    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Ticket.description.ilike(like))
            | (Ticket.affected_system.ilike(like))
            | (Ticket.category.ilike(like))
        )
    if severity:
        stmt = stmt.where(Ticket.severity == severity)
    if urgency:
        stmt = stmt.where(Ticket.urgency == urgency)
    if status_filter:
        stmt = stmt.where(Ticket.status == status_filter)
    if category:
        stmt = stmt.where(Ticket.category == category)
    if region:
        stmt = stmt.where(Ticket.region == region)

    stmt = stmt.order_by(Ticket.priority_score.desc(), Ticket.created_at.asc())
    res = await session.execute(stmt)
    rows = res.scalars().unique().all()
    return [_ticket_to_out(t, user) for t in rows]


@router.get("/best-fit", response_model=list[TicketOut])
async def best_fit_tickets(session: DBSession, user: TechOrAdmin) -> list[TicketOut]:
    """Tickets in categories this technician resolves most often (FR-26 MVP)."""
    sub = (
        select(Ticket.category, func.count().label("cnt"))
        .where(Ticket.assigned_to_id == user.id, Ticket.status == TicketStatus.resolved)
        .group_by(Ticket.category)
        .order_by(func.count().desc())
        .limit(1)
    )
    top = await session.execute(sub)
    row = top.first()
    if row is None:
        return []
    top_cat = row[0]
    stmt = (
        select(Ticket)
        .options(selectinload(Ticket.submitter), selectinload(Ticket.assignee))
        .where(
            Ticket.category == top_cat,
            Ticket.status.in_([TicketStatus.open, TicketStatus.assigned, TicketStatus.escalated]),
        )
        .order_by(Ticket.priority_score.desc(), Ticket.created_at.asc())
    )
    res = await session.execute(stmt)
    tickets = res.scalars().unique().all()
    return [_ticket_to_out(t, user) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(ticket_id: int, session: DBSession, user: CurrentUser) -> TicketOut:
    t = await _load_ticket(session, ticket_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if user.role == UserRole.end_user and t.submitted_by_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your ticket")
    return _ticket_to_out(t, user)



@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    session: DBSession,
    user: CurrentUser,
    description: str = Form(...),
    affected_system: str = Form(...),
    category: str = Form(...),
    region: str | None = Form(None),
    attachment: UploadFile | None = File(None),
) -> TicketOut:
    if len(description.strip()) < 10 or len(affected_system.strip()) < 2:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Description and affected system are required")
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Category must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}",
        )

    sev, urg, prio = classify_ticket(description, category, affected_system)
    ticket = Ticket(
        description=description.strip(),
        affected_system=affected_system.strip(),
        category=category,
        region=region.strip() if region else None,
        submitted_by_id=user.id,
        severity=sev,
        urgency=urg,
        priority_score=prio,
        status=TicketStatus.open,
    )
    session.add(ticket)
    await session.flush()

    if attachment and attachment.filename:
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        safe = Path(attachment.filename).name
        dest = settings.UPLOAD_DIR / f"{ticket.id}_{safe}"
        with dest.open("wb") as f:
            shutil.copyfileobj(attachment.file, f)
        ticket.attachment_path = str(dest)

    session.add(
        AuditLog(
            ticket_id=ticket.id,
            actor_user_id=user.id,
            actor_label="user",
            action="CREATED",
            payload={"severity": sev.value, "urgency": urg.value, "priority_score": prio},
        )
    )
    await session.commit()

    # Re-fetch with relationships eager-loaded
    result = await session.execute(
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.submitter),
            selectinload(Ticket.assignee),
        )
    )
    ticket = result.scalar_one()
    return _ticket_to_out(ticket, user)


@router.patch("/{ticket_id}/tech", response_model=TicketOut)
async def update_ticket_tech(
    ticket_id: int,
    body: TicketUpdateTech,
    session: DBSession,
    user: TechOrAdmin,
) -> TicketOut:
    t = await _load_ticket(session, ticket_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")

    if body.internal_notes is not None:
        t.internal_notes = body.internal_notes
        session.add(
            AuditLog(
                ticket_id=t.id,
                actor_user_id=user.id,
                actor_label="user",
                action="INTERNAL_NOTE",
                payload={"note_len": len(body.internal_notes)},
            )
        )

    if body.status is not None:
        if body.status == TicketStatus.resolved:
            summary = (body.resolution_summary or t.resolution_summary or "").strip()
            if not summary:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "resolution_summary is required to resolve a ticket",
                )
        prev_status = t.status
        old_status_str = t.status.value
        t.status = body.status
        if body.status == TicketStatus.resolved:
            t.resolution_summary = (body.resolution_summary or t.resolution_summary or "").strip()
            t.resolved_at = datetime.now(UTC)
        if body.status == TicketStatus.escalated and prev_status != TicketStatus.escalated:
            t.escalated_at = datetime.now(UTC)
        if body.status == TicketStatus.in_progress and prev_status != TicketStatus.in_progress:
            session.add(
                AuditLog(
                    ticket_id=t.id,
                    actor_user_id=user.id,
                    actor_label="user",
                    action="IN_PROGRESS",
                    payload={"started_at": datetime.now(UTC).isoformat()},
                )
            )
        session.add(
            AuditLog(
                ticket_id=t.id,
                actor_user_id=user.id,
                actor_label="user",
                action="STATUS_CHANGE",
                payload={"old_status": old_status_str, "new_status": t.status.value},
            )
        )

    if body.resolution_summary is not None and (body.status is None or body.status != TicketStatus.resolved):
        t.resolution_summary = body.resolution_summary

    await session.refresh(t, ["submitter", "assignee", "updated_at"])
    return _ticket_to_out(t, user)


@router.post("/{ticket_id}/claim", response_model=TicketOut)
async def claim_ticket(ticket_id: int, session: DBSession, user: TechOrAdmin) -> TicketOut:
    t = await _load_ticket(session, ticket_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    old_assignee = t.assigned_to_id
    t.assigned_to_id = user.id
    if t.status in (TicketStatus.open, TicketStatus.escalated):
        t.status = TicketStatus.assigned
    session.add(
        AuditLog(
            ticket_id=t.id,
            actor_user_id=user.id,
            actor_label="user",
            action="CLAIM",
            payload={"old_assignee_id": old_assignee, "new_assignee_id": user.id},
        )
    )
    await session.refresh(t, ["submitter", "assignee", "updated_at"])
    return _ticket_to_out(t, user)


@router.post("/{ticket_id}/assign", response_model=TicketOut)
async def assign_ticket(
    ticket_id: int,
    body: TicketAssign,
    session: DBSession,
    user: TechOrAdmin,
) -> TicketOut:
    t = await _load_ticket(session, ticket_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    assignee = await session.get(User, body.assignee_id)
    if assignee is None or assignee.role not in (UserRole.it_support, UserRole.admin):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid assignee")
    old = t.assigned_to_id
    t.assigned_to_id = body.assignee_id
    if t.status in (TicketStatus.open, TicketStatus.escalated):
        t.status = TicketStatus.assigned
    session.add(
        AuditLog(
            ticket_id=t.id,
            actor_user_id=user.id,
            actor_label="user",
            action="ASSIGN",
            payload={"old_assignee_id": old, "new_assignee_id": body.assignee_id},
        )
    )
    await session.refresh(t, ["submitter", "assignee", "updated_at"])
    return _ticket_to_out(t, user)


@router.patch("/{ticket_id}/admin", response_model=TicketOut)
async def admin_override_ticket(
    ticket_id: int,
    body: TicketAdminOverride,
    session: DBSession,
    admin: AdminUser,
) -> TicketOut:
    t = await _load_ticket(session, ticket_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")

    payload: dict = {}

    if body.severity is not None:
        payload["old_severity"] = t.severity.value
        t.severity = body.severity
        payload["new_severity"] = t.severity.value
    if body.urgency is not None:
        payload["old_urgency"] = t.urgency.value
        t.urgency = body.urgency
        payload["new_urgency"] = t.urgency.value
    if body.status is not None:
        payload["old_status"] = t.status.value
        t.status = body.status
        payload["new_status"] = t.status.value
        if t.status == TicketStatus.resolved and t.resolved_at is None:
            t.resolved_at = datetime.now(UTC)
    if "assigned_to_id" in body.model_fields_set:
        payload["old_assignee"] = t.assigned_to_id
        t.assigned_to_id = body.assigned_to_id
        payload["new_assignee"] = body.assigned_to_id

    t.priority_score = compute_priority_score(t.severity, t.urgency)

    if payload:
        session.add(
            AuditLog(
                ticket_id=t.id,
                actor_user_id=admin.id,
                actor_label="admin",
                action="ADMIN_OVERRIDE",
                payload=payload,
            )
        )
    await session.refresh(t, ["submitter", "assignee", "updated_at"])
    return _ticket_to_out(t, admin)
