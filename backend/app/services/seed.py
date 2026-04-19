from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.escalation_config import EscalationConfig
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
