from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import AdminUser, DBSession, TechOrAdmin
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User

router = APIRouter()


@router.get("/weekly")
async def weekly_report(session: DBSession, _user: TechOrAdmin) -> dict:
    """Closed tickets in the last 7 days by resolver department (FR-25 / FR-49 MVP)."""
    since = datetime.now(UTC) - timedelta(days=7)
    stmt = (
        select(User.department, func.count())
        .join(Ticket, Ticket.assigned_to_id == User.id)
        .where(Ticket.status == TicketStatus.resolved, Ticket.resolved_at.is_not(None), Ticket.resolved_at >= since)
        .group_by(User.department)
    )
    res = await session.execute(stmt)
    by_dept = {row[0]: row[1] for row in res.all()}

    esc_stmt = select(func.count()).select_from(Ticket).where(Ticket.status == TicketStatus.escalated)
    escalated_open = (await session.execute(esc_stmt)).scalar_one()

    return {
        "period_days": 7,
        "resolved_by_department": by_dept,
        "currently_escalated_count": escalated_open,
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/weekly-escalations")
async def weekly_escalations(session: DBSession, _admin: AdminUser) -> dict:
    from app.models.audit_log import AuditLog

    since = datetime.now(UTC) - timedelta(days=7)
    stmt = select(func.count()).select_from(AuditLog).where(
        AuditLog.action == "AUTO_ESCALATE",
        AuditLog.created_at >= since,
    )
    cnt = (await session.execute(stmt)).scalar_one()
    return {"auto_escalations_last_7_days": cnt, "since": since.isoformat()}
