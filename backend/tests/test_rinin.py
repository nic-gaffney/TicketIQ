"""
test_rinin.py — PA4 Functional Test Cases
==========================================
10 functional test cases hitting the real FastAPI app.

Key facts from reading the actual source:
- POST /tickets uses Form(...) not JSON
- Status updates go to PATCH /tickets/{id}/tech (TicketUpdateTech schema)
- List filter param is `status_filter`, not `status`
- Category must be one of the ALLOWED_CATEGORIES set (capitalized)
- Engine is created fresh per session to avoid asyncpg event loop conflicts

Rinin's 5:    FTC-31, FTC-34, FTC-35, FTC-39, FTC-40
Teammates' 5: FTC-03, FTC-04, FTC-05, FTC-45, FTC-46
"""

import io
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

import app.models  # noqa: F401 — register all ORM models with Base.metadata
from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, Severity, Urgency
from app.core.security import hash_password, create_access_token

# ---------------------------------------------------------------------------
# Database setup — fresh engine per test to avoid asyncpg event loop issues
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://appuser:apppassword@localhost:5432/appdb",
)


@pytest_asyncio.fixture()
async def db_session():
    """Fresh engine + session per test, creates and drops all tables."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    TestingSession = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session = TestingSession()

    async def override():
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    app.dependency_overrides[get_db] = override

    try:
        yield session
    finally:
        await session.close()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
        app.dependency_overrides.pop(get_db, None)


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def technician_user(db_session: AsyncSession):
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


# ---------------------------------------------------------------------------
# Ticket fixtures — insert directly into DB bypassing the API
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def sample_tickets(db_session: AsyncSession, end_user):
    user, _ = end_user
    tickets = [
        Ticket(
            description="Complete network failure affecting all offices",
            affected_system="Core Network Switch",
            category="Network",
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=90,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Laptop running slowly after update",
            affected_system="Dell XPS Laptop",
            category="Hardware",
            severity=Severity.low,
            urgency=Urgency.low,
            priority_score=20,
            status=TicketStatus.open,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Cannot access email client",
            affected_system="Outlook",
            category="Software",
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
    user, _ = end_user
    tickets = [
        Ticket(
            description="This was escalated due to SLA breach",
            affected_system="VPN Gateway",
            category="Network",
            severity=Severity.high,
            urgency=Urgency.high,
            priority_score=95,
            status=TicketStatus.escalated,
            submitted_by_id=user.id,
        ),
        Ticket(
            description="Minor software glitch",
            affected_system="CRM App",
            category="Software",
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
    user, _ = end_user
    ticket = Ticket(
        description="A test ticket for status changes",
        affected_system="Test System",
        category="Software",
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
async def test_ftc03_invalid_login_returns_401(db_session, end_user):
    """
    FTC-03: POST /auth/login with wrong password → 401 Unauthorized.
    """
    user, _ = end_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
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
async def test_ftc04_valid_ticket_submission_returns_201(db_session, end_user):
    """
    FTC-04: POST /tickets with all required fields → 201 Created.
    Note: endpoint uses Form(...) not JSON.
    """
    user, token = end_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tickets",
            data={
                "description": "The office printer throws a paper jam error on tray 2.",
                "affected_system": "HP LaserJet 4000",
                "category": "Hardware",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 201, (
        f"Expected 201 for valid ticket, got {response.status_code}: {response.text}"
    )
    assert "id" in response.json()


# ---------------------------------------------------------------------------
# FTC-05 (Dhruv) — Ticket missing description returns 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc05_ticket_missing_description_returns_422(db_session, end_user):
    """
    FTC-05: POST /tickets without description → 422 Unprocessable Entity.
    """
    user, token = end_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tickets",
            data={"affected_system": "Some System", "category": "Hardware"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422, (
        f"Expected 422 for missing description, got {response.status_code}"
    )


# ---------------------------------------------------------------------------
# FTC-31 (Rinin) — Ticket queue sorted by priority score high → low
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc31_ticket_queue_sorted_by_priority_score(db_session, technician_user, sample_tickets):
    """
    FTC-31: GET /tickets as technician → sorted by priority_score descending.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/tickets",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    tickets = response.json()
    assert len(tickets) >= 2, "Expected at least 2 tickets"
    scores = [t["priority_score"] for t in tickets if "priority_score" in t]
    assert scores == sorted(scores, reverse=True), (
        f"Tickets not sorted by priority score descending: {scores}"
    )


# ---------------------------------------------------------------------------
# FTC-34 (Rinin) — Resolving without resolution summary → 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc34_resolve_without_summary_returns_422(db_session, technician_user, open_ticket):
    """
    FTC-34: PATCH /tickets/{id}/tech with status=resolved, no resolution_summary → 422.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/tickets/{open_ticket.id}/tech",
            json={"status": "resolved"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422, (
        f"Expected 422 when resolving without summary, got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# FTC-35 (Rinin) — In-progress records updated_at timestamp
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc35_in_progress_records_timestamp(db_session, technician_user, open_ticket):
    """
    FTC-35: PATCH /tickets/{id}/tech with status=in_progress → updated_at is set.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/tickets/{open_ticket.id}/tech",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Expected 200 for in_progress update, got {response.status_code}: {response.text}"
    )
    data = response.json()
    assert data["status"] == "in_progress"
    assert data.get("updated_at") is not None, "Expected updated_at to be set"


# ---------------------------------------------------------------------------
# FTC-39 (Rinin) — Category filter returns only matching tickets
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc39_category_filter_returns_only_network_tickets(db_session, technician_user, sample_tickets):
    """
    FTC-39: GET /tickets?category=Network → only Network tickets returned.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/tickets?category=Network",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    tickets = response.json()
    assert len(tickets) >= 1, "Expected at least one Network ticket"
    for ticket in tickets:
        assert ticket["category"] == "Network", (
            f"Non-network ticket in filtered results: {ticket['category']}"
        )


# ---------------------------------------------------------------------------
# FTC-40 (Rinin) — Ticket with file attachment stores attachment_path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc40_ticket_with_attachment_stores_path(db_session, end_user):
    """
    FTC-40: POST /tickets with file attachment → attachment_path is stored.
    """
    user, token = end_user
    fake_file = io.BytesIO(b"diagnostic log content here")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tickets",
            data={
                "description": "Server crashed, attaching diagnostic log for review.",
                "affected_system": "App Server",
                "category": "Software",
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
async def test_ftc45_escalated_filter_returns_only_escalated_tickets(db_session, technician_user, escalated_tickets):
    """
    FTC-45: GET /tickets?status_filter=escalated → only escalated tickets.
    Note: the query param is `status_filter` (not `status`) per the endpoint source.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/tickets?status_filter=escalated",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    tickets = response.json()
    assert len(tickets) >= 1, "Expected at least one escalated ticket"
    for ticket in tickets:
        assert ticket["status"] == "escalated", (
            f"Non-escalated ticket in filtered results: {ticket['status']}"
        )


# ---------------------------------------------------------------------------
# FTC-46 (Azzam) — Claiming a ticket assigns it to the technician
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ftc46_claiming_ticket_assigns_to_technician(db_session, technician_user, open_ticket):
    """
    FTC-46: POST /tickets/{id}/claim → assigned_to_id updated to technician.
    """
    user, token = technician_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
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
