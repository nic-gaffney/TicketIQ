from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.escalation_config import EscalationConfig
from app.models.ticket import Severity, Ticket, TicketStatus


async def get_escalation_config(session: AsyncSession) -> EscalationConfig:
    res = await session.execute(select(EscalationConfig).where(EscalationConfig.id == 1))
    row = res.scalar_one_or_none()
    if row is None:
        row = EscalationConfig(id=1)
        session.add(row)
        await session.flush()
    return row


async def run_escalation_check(session: AsyncSession) -> int:
    """Auto-escalate high severity tickets unassigned past threshold (FR-40–FR-44). Returns count escalated."""
    cfg = await get_escalation_config(session)
    cutoff = datetime.now(UTC) - timedelta(minutes=cfg.high_unassigned_threshold_minutes)

    q = await session.execute(
        select(Ticket).where(
            Ticket.severity == Severity.high,
            Ticket.assigned_to_id.is_(None),
            Ticket.status.in_([TicketStatus.open, TicketStatus.assigned]),
            Ticket.created_at <= cutoff,
        )
    )
    tickets = q.scalars().all()
    count = 0
    for ticket in tickets:
        old_status = ticket.status.value
        ticket.status = TicketStatus.escalated
        ticket.escalated_at = datetime.now(UTC)
        session.add(
            AuditLog(
                ticket_id=ticket.id,
                actor_user_id=None,
                actor_label="system",
                action="AUTO_ESCALATE",
                payload={
                    "old_status": old_status,
                    "new_status": ticket.status.value,
                    "reason": f"unassigned > {cfg.high_unassigned_threshold_minutes} minutes",
                },
                message=f"Notify: {cfg.notification_target} — ticket #{ticket.id} high severity unassigned",
            )
        )
        count += 1
    return count
