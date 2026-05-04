"""
test_rinin.py — PA4 Functional Test Cases
==========================================
Covers 10 functional test cases using FastAPI's async test client
against the real PostgreSQL database (same as CI environment).

Rinin's 5:    FTC-31, FTC-34, FTC-35, FTC-39, FTC-40
Teammates' 5: FTC-03, FTC-04, FTC-05, FTC-45, FTC-46
"""

import io
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, Severity, Urgency
from app.core.security import hash_password, create_access_token

# ---------------------------------------------------------------------------
# Use the real Postgres DB (already running in CI via docker service)
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://appuser:apppassword@localhost:5432/appdb",
)

engine = create_async_engine(DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture()
async def db_session():
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture()
async def technician_user(db_session: AsyncSession):
    """Create a technician user and return (user, token)."""
    user = User(
        email="tech@example.com",
        hashed_password=hash_password("Tech@1234"),
        full_name="Tech User",
        role=UserRole.it_support,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(str(user.id))
    return user, token


@pytest_asyncio.fixture()
async def end_user(db_session: AsyncSession):
    """Create a regular end user and return (user, token)."""
    user = User(
        email="user@example.com",
        hashed_password=hash_password("User@1234"),
        full_name="End User",
        role=UserRole.end_user,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token(str(user.id))
    return user, token


@pytest_asyncio.fixture()
async def sample_tickets(db_session: AsyncSession, end_user):
    """Create tickets with varying priority scores for sorting tests."""
    user, _ = end_user
    tickets = [
        Ticket(
            description="Complete network failure affecting all offices",
            affected_system="Core Network Switch",
            category="network",
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=90,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Laptop running slowly after update",
            affected_system="Dell XPS Laptop",
            category="hardware",
            severity=Severity.low,
            urgency=Urgency.low,
            priority_score=20,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Cannot access email client",
            affected_system="Outlook",
            category="software",
            severity=Severity.medium,
            urgency=Urgency.medium,
            priority_score=55,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
    ]
    for t in tickets:
        db_session.add(t)
    await db_session.commit()
    return tickets


@pytest_asyncio.fixture()
async def escalated_tickets(db_session: AsyncSession, end_user):
    """Create tickets in different statuses including escalated."""
    user, _ = end_user
    tickets = [
        Ticket(
            description="This was escalated due to SLA breach",
            affected_system="VPN Gateway",
            category="network",
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=95,
            status=TicketStatus.escalated,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Minor software glitch",
            affected_system="CRM App",
            category="software",
            severity=Severity.low,
            urgency=Urgency.low,
            priority_score=15,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
    ]
    for t in tickets:
        db_session.add(t)
    await db_session.commit()
    return tickets


@pytest_asyncio.fixture()
async def open_ticket(db_session: AsyncSession, end_user):
    """Create a single open ticket for status-change tests."""
    user, _ = end_user
    ticket = Ticket(
        description="A test ticket for status changes",
        affected_system="Test System",
        category="software",
        severity=Severity.medium,
        urgency=Urgency.medium,
        priority_score=50,
        status=TicketStatus.open,
        submitted_by_id=user.id,
    )
    db_session.add(ticket)
    await db_session.commit()
    await db_session.refresh(ticket)
    return ticket


# ---------------------------------------------------------------------------
# FTC-03 (Dhruv) — Invalid login returns 401
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc03_invalid_login_returns_401(end_user):
    """
    FTC-03: POST /auth/login with wrong password → 401 Unauthorized.
    Verifies the system rejects bad credentials.
    """
    user, _ = end_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": "WrongPassword!"},
        )
    assert response.status_code == 401, (
        f"Expected 401 for invalid credentials, got {response.status_code}"
    )


# ---------------------------------------------------------------------------
# FTC-04 (Dhruv) — Valid ticket submission returns 201
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc04_valid_ticket_submission_returns_201(end_user):
    """
    FTC-04: POST /tickets with all required fields → 201 Created.
    Verifies a valid ticket is accepted and stored.
    """
    user, token = end_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/tickets",
            json={
                "description": "The office printer throws a paper jam error on tray 2.",
                "affected_system": "HP LaserJet 4000",
                "category": "hardware",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 201, (
        f"Expected 201 for valid ticket, got {response.status_code}: {response.text}"
    )
    data = response.json()
    assert "id" in data


# ---------------------------------------------------------------------------
# FTC-05 (Dhruv) — Ticket with missing description returns 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc05_ticket_missing_description_returns_422(end_user):
    """
    FTC-05: POST /tickets without a description → 422 Unprocessable Entity.
    Verifies the system enforces required fields.
    """
    user, token = end_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/tickets",
            json={"affected_system": "Some System", "category": "hardware"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422, (
        f"Expected 422 for missing description, got {response.status_code}"
    )


# ---------------------------------------------------------------------------
# FTC-31 (Rinin) — Ticket queue sorted by priority score high → low
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc31_ticket_queue_sorted_by_priority_score(technician_user, sample_tickets):
    """
    FTC-31: GET /tickets as technician → tickets returned sorted by
    priority_score descending (highest urgency first).
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/api/v1/tickets",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for ticket list, got {response.status_code}"
    )
    tickets = response.json()
    assert len(tickets) >= 2, "Expected at least 2 tickets in queue"
    scores = [t["priority_score"] for t in tickets if "priority_score" in t]
    assert scores == sorted(scores, reverse=True), (
        f"Tickets not sorted by priority score descending: {scores}"
    )


# ---------------------------------------------------------------------------
# FTC-34 (Rinin) — Resolving ticket without resolution summary → 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc34_resolve_without_summary_returns_422(technician_user, open_ticket):
    """
    FTC-34: PATCH /tickets/{id} with status=resolved but no resolution_summary
    → 422. System must reject resolution without a summary.
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.patch(
            f"/api/v1/tickets/{open_ticket.id}",
            json={"status": "resolved"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422, (
        f"Expected 422 when resolving without summary, got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# FTC-35 (Rinin) — Switching to in_progress records a timestamp
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc35_in_progress_records_timestamp(technician_user, open_ticket):
    """
    FTC-35: PATCH /tickets/{id} with status=in_progress → response includes
    updated_at timestamp showing when the technician started work.
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.patch(
            f"/api/v1/tickets/{open_ticket.id}",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for in_progress update, got {response.status_code}: {response.text}"
    )
    data = response.json()
    assert data["status"] == "in_progress"
    assert data.get("updated_at") is not None, (
        "Expected updated_at timestamp to be set when ticket moves to in_progress"
    )


# ---------------------------------------------------------------------------
# FTC-39 (Rinin) — Category filter returns only matching tickets
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc39_category_filter_returns_only_network_tickets(
    technician_user, sample_tickets
):
    """
    FTC-39: GET /tickets?category=network → only Network category tickets
    are returned in the queue.
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/api/v1/tickets?category=network",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for filtered ticket list, got {response.status_code}"
    )
    tickets = response.json()
    assert len(tickets) >= 1, "Expected at least one network ticket"
    for ticket in tickets:
        assert ticket["category"] == "network", (
            f"Found non-network ticket in filtered results: {ticket['category']}"
        )


# ---------------------------------------------------------------------------
# FTC-40 (Rinin) — Ticket with file attachment stores attachment_path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc40_ticket_with_attachment_stores_path(end_user):
    """
    FTC-40: POST /tickets with a file attachment → 201 Created and
    the response includes a non-null attachment_path field.
    """
    user, token = end_user
    fake_file = io.BytesIO(b"diagnostic log content here")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/tickets",
            data={
                "description": "Server crashed, attaching diagnostic log.",
                "affected_system": "App Server",
                "category": "software",
            },
            files={"attachment": ("diagnostic.log", fake_file, "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 201, (
        f"Expected 201 for ticket with attachment, got {response.status_code}: {response.text}"
    )
    data = response.json()
    assert data.get("attachment_path") is not None, (
        "Expected attachment_path to be set after file upload"
    )


# ---------------------------------------------------------------------------
# FTC-45 (Azzam) — Filter by status=escalated returns only escalated tickets
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc45_escalated_filter_returns_only_escalated_tickets(
    technician_user, escalated_tickets
):
    """
    FTC-45: GET /tickets?status=escalated → only escalated tickets returned.
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/api/v1/tickets?status=escalated",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for escalated filter, got {response.status_code}"
    )
    tickets = response.json()
    assert len(tickets) >= 1, "Expected at least one escalated ticket"
    for ticket in tickets:
        assert ticket["status"] == "escalated", (
            f"Found non-escalated ticket in escalated filter: {ticket['status']}"
        )


# ---------------------------------------------------------------------------
# FTC-46 (Azzam) — Claiming a ticket assigns it to the technician
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc46_claiming_ticket_assigns_to_technician(
    technician_user, open_ticket
):
    """
    FTC-46: POST /tickets/{id}/claim → ticket's assigned_to_id updated
    to the technician's user ID.
    """
    user, token = technician_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/api/v1/tickets/{open_ticket.id}/claim",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for ticket claim, got {response.status_code}: {response.text}"
    )
    data = response.json()
    assigned = data.get("assigned_to_id") or data.get("assigned_to")
    assert str(assigned) == str(user.id), (
        f"Expected assigned_to_id={user.id}, got {assigned}"
    )
