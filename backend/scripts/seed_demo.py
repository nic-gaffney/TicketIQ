# scripts/seed_demo.py
# Run this inside the backend container:
#   docker compose exec app python scripts/seed_demo.py
#
# Creates realistic T-Mobile demo data:
#   - 10 users (end users, technicians, admins)
#   - 20 tickets across all severities, statuses, categories
#   - Escalated tickets with audit log entries
#   - Escalation config

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog
from app.models.escalation_config import EscalationConfig
from app.models.ticket import Severity, Ticket, TicketStatus, Urgency
from app.models.user import User, UserRole


# ── Helper ────────────────────────────────────────────────────────────────────
def ago(minutes: int = 0, hours: int = 0, days: int = 0) -> datetime:
    return datetime.now(UTC) - timedelta(minutes=minutes, hours=hours, days=days)


# ── Users ─────────────────────────────────────────────────────────────────────
USERS = [
    # end users
    dict(email="jamie@tmobile.com",   password="password123", full_name="Jamie Reyes",      role=UserRole.end_user,  department="Sales",          region="US-East"),
    dict(email="priya@tmobile.com",   password="password123", full_name="Priya Patel",       role=UserRole.end_user,  department="Marketing",      region="US-West"),
    dict(email="marcus@tmobile.com",  password="password123", full_name="Marcus Chen",       role=UserRole.end_user,  department="Finance",        region="Central"),
    dict(email="sofia@tmobile.com",   password="password123", full_name="Sofia Alvarez",     role=UserRole.end_user,  department="HR",             region="US-East"),
    # it support technicians
    dict(email="alex@tmobile.com",    password="password123", full_name="Alex Technician",   role=UserRole.it_support, department="IT Operations",  region="US-West"),
    dict(email="sarah@tmobile.com",   password="password123", full_name="Sarah Kim",         role=UserRole.it_support, department="IT Operations",  region="US-East"),
    dict(email="david@tmobile.com",   password="password123", full_name="David Patel",       role=UserRole.it_support, department="Network Ops",    region="Central"),
    dict(email="james@tmobile.com",   password="password123", full_name="James Wilson",      role=UserRole.it_support, department="IT Operations",  region="US-West"),
    # admins
    dict(email="riley@tmobile.com",   password="password123", full_name="Riley Admin",       role=UserRole.admin,      department="IT Management",  region="Central"),
    dict(email="morgan@tmobile.com",  password="password123", full_name="Morgan Lee",        role=UserRole.admin,      department="IT Management",  region="US-East"),
]

# ── Tickets ───────────────────────────────────────────────────────────────────
# Each dict maps to Ticket model fields.
# submitter_email and assignee_email are resolved to IDs after users are created.
TICKETS = [
    # ── Escalated (high severity, unassigned > 30 min) ──
    dict(
        description="VPN connection failures affecting entire Atlanta sales floor. 40+ employees cannot access internal systems. Critical business impact.",
        affected_system="VPN Gateway",
        category="Network",
        region="US-East",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=95,
        status=TicketStatus.escalated,
        submitter_email="jamie@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=2),
        escalated_at=ago(hours=1),
    ),
    dict(
        description="SSL certificate expiring in 24 hours on customer-facing portal. Renewal blocked by permissions issue in AWS Certificate Manager.",
        affected_system="Customer Portal",
        category="Security",
        region="US-West",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=92,
        status=TicketStatus.escalated,
        submitter_email="priya@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=3),
        escalated_at=ago(hours=2),
    ),
    dict(
        description="Payment gateway API returning 500 errors intermittently. Approx 15% of transactions failing. Revenue impact confirmed.",
        affected_system="Payment Gateway",
        category="Software",
        region="Central",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=98,
        status=TicketStatus.escalated,
        submitter_email="marcus@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=1, minutes=45),
        escalated_at=ago(minutes=45),
    ),
    # ── High severity, assigned ──
    dict(
        description="Database server not responding in US-East region. Affects all ticket lookup and reporting functionality.",
        affected_system="PostgreSQL RDS",
        category="Network",
        region="US-East",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=90,
        status=TicketStatus.assigned,
        submitter_email="sofia@tmobile.com",
        assignee_email="david@tmobile.com",
        created_at=ago(hours=1),
        escalated_at=None,
    ),
    dict(
        description="Email server delayed messages — employees not receiving external emails for past 2 hours. Affects executive communications.",
        affected_system="Exchange Server",
        category="Email",
        region="US-East",
        severity=Severity.high,
        urgency=Urgency.medium,
        priority_score=82,
        status=TicketStatus.in_progress,
        submitter_email="jamie@tmobile.com",
        assignee_email="sarah@tmobile.com",
        created_at=ago(hours=3),
        escalated_at=None,
    ),
    # ── Medium severity, in progress ──
    dict(
        description="Application server showing high memory usage — 94% utilization. Risk of OOM crash if not addressed.",
        affected_system="App Server Cluster",
        category="Hardware",
        region="US-West",
        severity=Severity.medium,
        urgency=Urgency.medium,
        priority_score=60,
        status=TicketStatus.in_progress,
        submitter_email="priya@tmobile.com",
        assignee_email="alex@tmobile.com",
        created_at=ago(hours=5),
        escalated_at=None,
    ),
    dict(
        description="Network latency spikes in datacenter US-West-2. Intermittent packet loss affecting internal tools.",
        affected_system="Core Network Switch",
        category="Network",
        region="US-West",
        severity=Severity.medium,
        urgency=Urgency.medium,
        priority_score=58,
        status=TicketStatus.assigned,
        submitter_email="marcus@tmobile.com",
        assignee_email="james@tmobile.com",
        created_at=ago(hours=4),
        escalated_at=None,
    ),
    dict(
        description="User account locked after multiple failed login attempts. User is unable to access TicketIQ and CRM systems.",
        affected_system="SSO / Active Directory",
        category="Access",
        region="Central",
        severity=Severity.medium,
        urgency=Urgency.medium,
        priority_score=55,
        status=TicketStatus.open,
        submitter_email="sofia@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=2),
        escalated_at=None,
    ),
    dict(
        description="Printer offline on 3rd floor — HP LaserJet not responding to print jobs from any workstation on the floor.",
        affected_system="HP LaserJet 3F",
        category="Hardware",
        region="US-East",
        severity=Severity.medium,
        urgency=Urgency.low,
        priority_score=40,
        status=TicketStatus.open,
        submitter_email="jamie@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=6),
        escalated_at=None,
    ),
    # ── Low severity, open ──
    dict(
        description="Microsoft Teams crashing on startup for one user after recent Windows update. Machine: DESK-ATL-042.",
        affected_system="Microsoft Teams",
        category="Software",
        region="US-East",
        severity=Severity.low,
        urgency=Urgency.low,
        priority_score=20,
        status=TicketStatus.open,
        submitter_email="jamie@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=8),
        escalated_at=None,
    ),
    dict(
        description="Request to install Adobe Acrobat Pro on workstation DESK-LA-007. Required for contract review workflow.",
        affected_system="Workstation DESK-LA-007",
        category="Software",
        region="US-West",
        severity=Severity.low,
        urgency=Urgency.low,
        priority_score=15,
        status=TicketStatus.open,
        submitter_email="priya@tmobile.com",
        assignee_email=None,
        created_at=ago(hours=10),
        escalated_at=None,
    ),
    dict(
        description="Monitor flickering on workstation DESK-CHI-019. Issue started after moving to new desk. May need replacement cable.",
        affected_system="Workstation DESK-CHI-019",
        category="Hardware",
        region="Central",
        severity=Severity.low,
        urgency=Urgency.low,
        priority_score=12,
        status=TicketStatus.open,
        submitter_email="marcus@tmobile.com",
        assignee_email=None,
        created_at=ago(days=1),
        escalated_at=None,
    ),
    # ── Resolved ──
    dict(
        description="Backup system failed last night — nightly backup job did not complete for US-East region. Data at risk.",
        affected_system="Backup Server US-East",
        category="Hardware",
        region="US-East",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=88,
        status=TicketStatus.resolved,
        submitter_email="sofia@tmobile.com",
        assignee_email="david@tmobile.com",
        created_at=ago(days=2),
        escalated_at=None,
        resolved_at=ago(days=1, hours=18),
        resolution_summary="Identified disk space issue on backup server. Cleared old backups and re-ran job successfully. Added monitoring alert for disk usage > 80%.",
    ),
    dict(
        description="Corporate VPN documents not syncing every 15 minutes as configured. Last successful sync was 3 hours ago.",
        affected_system="VPN Document Sync",
        category="Network",
        region="US-East",
        severity=Severity.medium,
        urgency=Urgency.medium,
        priority_score=55,
        status=TicketStatus.resolved,
        submitter_email="jamie@tmobile.com",
        assignee_email="sarah@tmobile.com",
        created_at=ago(days=3),
        escalated_at=None,
        resolved_at=ago(days=2, hours=20),
        resolution_summary="Sync service had stopped due to certificate expiry. Renewed cert and restarted service. Verified sync running correctly.",
    ),
    dict(
        description="Retail POS offline at store #423. Unable to process card transactions. Store using manual backup process.",
        affected_system="POS Terminal Store #423",
        category="Hardware",
        region="US-West",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=91,
        status=TicketStatus.resolved,
        submitter_email="priya@tmobile.com",
        assignee_email="alex@tmobile.com",
        created_at=ago(days=1, hours=6),
        escalated_at=None,
        resolved_at=ago(hours=20),
        resolution_summary="POS terminal had corrupted config file after power outage. Restored from backup config. Terminal operational and processing transactions.",
    ),
    dict(
        description="Password reset request for user sofia.alvarez@tmobile.com. User locked out after returning from leave.",
        affected_system="Active Directory",
        category="Access",
        region="US-East",
        severity=Severity.low,
        urgency=Urgency.medium,
        priority_score=30,
        status=TicketStatus.resolved,
        submitter_email="sofia@tmobile.com",
        assignee_email="james@tmobile.com",
        created_at=ago(days=4),
        escalated_at=None,
        resolved_at=ago(days=3, hours=22),
        resolution_summary="Reset password via AD admin console. User verified access to all systems. MFA re-enrolled successfully.",
    ),
    dict(
        description="Phishing email reported by multiple employees in Finance department. Suspicious link to external credential harvesting site.",
        affected_system="Email / Security",
        category="Security",
        region="Central",
        severity=Severity.high,
        urgency=Urgency.high,
        priority_score=93,
        status=TicketStatus.resolved,
        submitter_email="marcus@tmobile.com",
        assignee_email="david@tmobile.com",
        created_at=ago(days=5),
        escalated_at=None,
        resolved_at=ago(days=4, hours=16),
        resolution_summary="Blocked sender domain at email gateway. Ran phishing simulation report. No credentials compromised. Security awareness reminder sent to Finance team.",
    ),
    dict(
        description="Slow internet reported by entire US-West office. Speedtest showing 2Mbps vs expected 500Mbps.",
        affected_system="ISP / Core Router",
        category="Network",
        region="US-West",
        severity=Severity.medium,
        urgency=Urgency.high,
        priority_score=70,
        status=TicketStatus.resolved,
        submitter_email="priya@tmobile.com",
        assignee_email="alex@tmobile.com",
        created_at=ago(days=6),
        escalated_at=None,
        resolved_at=ago(days=5, hours=14),
        resolution_summary="ISP confirmed routing issue on their end affecting our circuit. Issue resolved by ISP within 4 hours. Failover to backup circuit activated during outage.",
    ),
    dict(
        description="Laptop keyboard not working after coffee spill. User needs loaner device while repair is assessed.",
        affected_system="Laptop LAPTOP-NY-088",
        category="Hardware",
        region="US-East",
        severity=Severity.low,
        urgency=Urgency.low,
        priority_score=10,
        status=TicketStatus.resolved,
        submitter_email="jamie@tmobile.com",
        assignee_email="sarah@tmobile.com",
        created_at=ago(days=7),
        escalated_at=None,
        resolved_at=ago(days=6, hours=10),
        resolution_summary="Issued loaner laptop. Original device sent to repair. User transferred to loaner and working normally.",
    ),
    dict(
        description="Zoom video not working during client presentation. Camera showing black screen. Audio working fine.",
        affected_system="Zoom / Webcam",
        category="Software",
        region="Central",
        severity=Severity.low,
        urgency=Urgency.medium,
        priority_score=25,
        status=TicketStatus.resolved,
        submitter_email="sofia@tmobile.com",
        assignee_email="james@tmobile.com",
        created_at=ago(days=8),
        escalated_at=None,
        resolved_at=ago(days=7, hours=8),
        resolution_summary="Camera driver conflict after Windows update. Rolled back driver to previous version. Camera working correctly.",
    ),
]


# ── Main seed function ────────────────────────────────────────────────────────
async def seed():
    async with AsyncSessionLocal() as session:

        # Check if already seeded
        existing = await session.execute(select(User).limit(1))
        if existing.scalar_one_or_none():
            print("⚠ Database already has users. Skipping seed to avoid duplicates.")
            print("  To re-seed, reset the database first with: docker compose down -v && docker compose up -d")
            return

        print("🌱 Seeding demo data...\n")

        # ── Create users ──────────────────────────────────────────────────────
        user_map: dict[str, User] = {}
        for u in USERS:
            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                department=u["department"],
                region=u["region"],
                is_active=True,
            )
            session.add(user)
            user_map[u["email"]] = user
            print(f"  ✓ User: {u['full_name']} ({u['role']}) — {u['email']}")

        await session.flush()

        # ── Create escalation config ──────────────────────────────────────────
        session.add(EscalationConfig(
            id=1,
            high_unassigned_threshold_minutes=30,
            job_interval_seconds=300,
            notification_target="it-manager@tmobile.example",
        ))
        print("\n  ✓ Escalation config created")

        # ── Create tickets ────────────────────────────────────────────────────
        print("\n  Creating tickets...")
        ticket_objs: list[Ticket] = []
        for td in TICKETS:
            submitter = user_map[td["submitter_email"]]
            assignee = user_map.get(td.get("assignee_email")) if td.get("assignee_email") else None

            ticket = Ticket(
                description=td["description"],
                affected_system=td["affected_system"],
                category=td["category"],
                region=td.get("region"),
                severity=td["severity"],
                urgency=td["urgency"],
                priority_score=td["priority_score"],
                status=td["status"],
                submitted_by_id=submitter.id,
                assigned_to_id=assignee.id if assignee else None,
                created_at=td.get("created_at", datetime.now(UTC)),
                escalated_at=td.get("escalated_at"),
                resolved_at=td.get("resolved_at"),
                resolution_summary=td.get("resolution_summary"),
            )
            session.add(ticket)
            ticket_objs.append(ticket)

        await session.flush()

        # ── Create audit logs for escalated tickets ───────────────────────────
        print("  Creating audit logs...")
        for ticket in ticket_objs:
            # Creation log for every ticket
            session.add(AuditLog(
                ticket_id=ticket.id,
                actor_user_id=ticket.submitted_by_id,
                actor_label="user",
                action="CREATED",
                payload={
                    "severity": ticket.severity.value,
                    "urgency": ticket.urgency.value,
                    "priority_score": ticket.priority_score,
                },
                created_at=ticket.created_at,
            ))

            # Auto escalation log for escalated tickets
            if ticket.status == TicketStatus.escalated and ticket.escalated_at:
                session.add(AuditLog(
                    ticket_id=ticket.id,
                    actor_user_id=None,
                    actor_label="system",
                    action="AUTO_ESCALATE",
                    payload={
                        "old_status": "open",
                        "new_status": "escalated",
                        "reason": "unassigned > 30 minutes",
                    },
                    message=f"Notify: it-manager@tmobile.example — ticket #{ticket.id} high severity unassigned",
                    created_at=ticket.escalated_at,
                ))

            # Resolution log for resolved tickets
            if ticket.status == TicketStatus.resolved and ticket.resolved_at and ticket.assigned_to_id:
                session.add(AuditLog(
                    ticket_id=ticket.id,
                    actor_user_id=ticket.assigned_to_id,
                    actor_label="user",
                    action="STATUS_CHANGE",
                    payload={
                        "old_status": "in_progress",
                        "new_status": "resolved",
                    },
                    created_at=ticket.resolved_at,
                ))

        await session.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        total_tickets = len(TICKETS)
        escalated = sum(1 for t in TICKETS if t["status"] == TicketStatus.escalated)
        resolved = sum(1 for t in TICKETS if t["status"] == TicketStatus.resolved)
        open_t = sum(1 for t in TICKETS if t["status"] == TicketStatus.open)
        in_prog = sum(1 for t in TICKETS if t["status"] == TicketStatus.in_progress)

        print(f"""
✅ Seed complete!

  Users:    {len(USERS)} ({sum(1 for u in USERS if u['role'] == UserRole.end_user)} end users, {sum(1 for u in USERS if u['role'] == UserRole.it_support)} technicians, {sum(1 for u in USERS if u['role'] == UserRole.admin)} admins)
  Tickets:  {total_tickets} total
    - Escalated:   {escalated}
    - In Progress: {in_prog}
    - Open:        {open_t}
    - Resolved:    {resolved}

Demo login credentials:
  End user:   jamie@tmobile.com / password123
  Technician: alex@tmobile.com  / password123
  Admin:      riley@tmobile.com / password123
""")


if __name__ == "__main__":
    asyncio.run(seed())
