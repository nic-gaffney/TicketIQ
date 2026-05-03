from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.escalation_config import EscalationConfig
from app.models.ticket import Severity, Ticket, TicketStatus, Urgency
from app.models.user import User, UserRole


async def seed_if_empty(session: AsyncSession) -> None:
    res = await session.execute(select(User).limit(1))
    if res.scalar_one_or_none() is not None:
        return

    demo_users = [
        ("user@ticketiq.demo", "password123", "Jamie Subscriber", UserRole.end_user, "US-East"),
        ("tech@ticketiq.demo", "password123", "Alex Technician", UserRole.it_support, "US-West"),
        ("admin@ticketiq.demo", "password123", "Riley Admin", UserRole.admin, "Central"),
    ]
    for email, pw, name, role, region in demo_users:
        session.add(
            User(
                email=email,
                hashed_password=hash_password(pw),
                full_name=name,
                role=role,
                region=region,
            )
        )

    session.add(
        EscalationConfig(
            id=1,
            high_unassigned_threshold_minutes=30,
            job_interval_seconds=300,
            notification_target="it-manager@tmobile.example",
        )
    )


async def seed_demo_tickets_if_needed(session: AsyncSession) -> None:
    """Insert demo tickets for user@ticketiq.demo when that user has none (idempotent)."""
    res = await session.execute(select(User).where(User.email == "user@ticketiq.demo"))
    end_user = res.scalar_one_or_none()
    if end_user is None:
        return

    cnt = (
        await session.execute(
            select(func.count()).select_from(Ticket).where(Ticket.submitted_by_id == end_user.id)
        )
    ).scalar_one()
    if int(cnt) > 0:
        return

    tech_res = await session.execute(select(User).where(User.email == "tech@ticketiq.demo"))
    tech = tech_res.scalar_one_or_none()
    tech_id = tech.id if tech else None

    now = datetime.now(UTC)

    demo: list[Ticket] = [
        Ticket(
            description=(
                "Intermittent Wi-Fi drops on POS tablets at store 4421; guests complain; "
                "rebooting the AP helps for about 10 minutes then issues return."
            ),
            affected_system="POS / WLAN",
            category="Network",
            region="US-East",
            status=TicketStatus.open,
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=78,
            submitted_by_id=end_user.id,
            assigned_to_id=None,
        ),
        Ticket(
            description=(
                "Dell laptop shows 'No bootable device' after Windows update overnight. "
                "BitLocker recovery key is unclear. User needs laptop for client meetings."
            ),
            affected_system="Windows laptop",
            category="Software",
            region="US-East",
            status=TicketStatus.assigned,
            severity=Severity.medium,
            urgency=Urgency.medium,
            priority_score=52,
            submitted_by_id=end_user.id,
            assigned_to_id=tech_id,
        ),
        Ticket(
            description=(
                "Side door badge reader LED is off; security team asked for an urgent check. "
                "Door must stay secured per policy."
            ),
            affected_system="Building access",
            category="Security",
            region="US-East",
            status=TicketStatus.in_progress,
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=81,
            submitted_by_id=end_user.id,
            assigned_to_id=tech_id,
        ),
        Ticket(
            description=(
                "New hire cannot enroll MFA; Microsoft 365 says 'contact admin'. "
                "Start date is Monday; needs access to email and Teams before then."
            ),
            affected_system="Microsoft 365 / MFA",
            category="Access",
            region="US-East",
            status=TicketStatus.open,
            severity=Severity.medium,
            urgency=Urgency.high,
            priority_score=58,
            submitted_by_id=end_user.id,
            assigned_to_id=None,
        ),
        Ticket(
            description=(
                "User forwarded a suspicious payroll-themed email and wants confirmation whether "
                "it is phishing and whether their mailbox should be scanned."
            ),
            affected_system="Outlook / Exchange",
            category="Email",
            region="US-East",
            status=TicketStatus.escalated,
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=74,
            submitted_by_id=end_user.id,
            assigned_to_id=None,
            escalated_at=now,
        ),
        Ticket(
            description=(
                "Cisco AnyConnect hangs at 'contacting security gateway' when working from home. "
                "Other websites load fine; issue started after ISP maintenance."
            ),
            affected_system="Remote VPN",
            category="VPN",
            region="US-East",
            status=TicketStatus.open,
            severity=Severity.low,
            urgency=Urgency.medium,
            priority_score=41,
            submitted_by_id=end_user.id,
            assigned_to_id=None,
        ),
        Ticket(
            description=(
                "General question about the IT portal and which ticket category to choose "
                "for software versus access requests. Low urgency."
            ),
            affected_system="Internal portal",
            category="Other",
            region="US-East",
            status=TicketStatus.open,
            severity=Severity.low,
            urgency=Urgency.low,
            priority_score=28,
            submitted_by_id=end_user.id,
            assigned_to_id=None,
        ),
    ]
    for t in demo:
        session.add(t)
