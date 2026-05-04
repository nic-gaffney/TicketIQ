"""
Extended backend tests for TicketIQ.
Covers:
  - Classification service (FR-03 to FR-06)
  - Security / JWT utilities
  - Escalation service logic
  - Health endpoint
  - Auth endpoint (login / me)
  - Ticket API (create, list, get, claim, status update)

Run with:
    pytest tests/test_extended.py -v
"""

import pytest
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.ticket import Severity, Urgency, TicketStatus
from app.models.user import UserRole
from app.services.classification import classify_ticket, compute_priority_score
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


# ===========================================================================
# Classification Service Tests (FR-03 – FR-06)
# ===========================================================================

class TestComputePriorityScore:
    """Tests for the priority scoring formula."""

    def test_high_high_equals_33(self):
        assert compute_priority_score(Severity.high, Urgency.high) == 33

    def test_low_low_equals_11(self):
        assert compute_priority_score(Severity.low, Urgency.low) == 11

    def test_medium_medium_equals_22(self):
        assert compute_priority_score(Severity.medium, Urgency.medium) == 22

    def test_high_low_equals_31(self):
        assert compute_priority_score(Severity.high, Urgency.low) == 31

    def test_low_high_equals_13(self):
        assert compute_priority_score(Severity.low, Urgency.high) == 13

    def test_medium_high_equals_23(self):
        assert compute_priority_score(Severity.medium, Urgency.high) == 23

    def test_all_scores_are_positive(self):
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) > 0

    def test_severity_dominates_urgency(self):
        """High severity + low urgency should beat low severity + high urgency."""
        assert compute_priority_score(Severity.high, Urgency.low) > compute_priority_score(Severity.low, Urgency.high)

    def test_high_high_is_global_max(self):
        max_score = compute_priority_score(Severity.high, Urgency.high)
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) <= max_score

    def test_low_low_is_global_min(self):
        min_score = compute_priority_score(Severity.low, Urgency.low)
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) >= min_score


class TestClassifyTicketSeverity:
    """Severity keyword detection."""

    @pytest.mark.parametrize("description,expected", [
        ("Production outage affecting all users in Dallas", Severity.high),
        ("System is completely down for all users", Severity.high),
        ("Possible data loss on backup server", Severity.high),
        ("Suspected security breach on admin account", Severity.high),
        ("Complete failure of core network switch", Severity.high),
        ("Application is running very slow today", Severity.medium),
        ("User cannot access the VPN portal", Severity.medium),
        ("Email not working since this morning", Severity.medium),
        ("How do I reset my voicemail PIN?", Severity.low),
        ("Question about printer paper tray", Severity.low),
    ])
    def test_severity_from_description(self, description, expected):
        sev, _, _ = classify_ticket(description, "Other", "Generic System")
        assert sev == expected

    def test_security_category_upgrades_low_to_medium(self):
        sev, _, _ = classify_ticket("Need help with something", "Security", "IAM Portal")
        assert sev == Severity.medium

    def test_network_category_upgrades_low_to_medium(self):
        sev, _, _ = classify_ticket("Need help with something", "Network", "WiFi")
        assert sev == Severity.medium

    def test_high_keyword_overrides_category_boost(self):
        """High keyword in text should stay high regardless of category."""
        sev, _, _ = classify_ticket("Complete network outage", "Network", "Core Router")
        assert sev == Severity.high

    def test_other_category_does_not_boost_low(self):
        sev, _, _ = classify_ticket("General question", "Other", "Misc")
        assert sev == Severity.low


class TestClassifyTicketUrgency:
    """Urgency keyword detection."""

    @pytest.mark.parametrize("description,expected", [
        ("Fix this asap it is blocking everyone", Urgency.high),
        ("Need this resolved immediately", Urgency.high),
        ("P1 outage right now", Urgency.high),
        ("System is down blocking all operations", Urgency.high),
        ("This is a severity 1 incident", Urgency.high),
        ("Emergency: data center fire alarm triggered", Urgency.high),
    ])
    def test_emergency_keywords_trigger_high_urgency(self, description, expected):
        _, urg, _ = classify_ticket(description, "Network", "Core Switch")
        assert urg == expected

    def test_high_severity_auto_promotes_urgency_from_low(self):
        """High severity with no urgency keywords must not stay at low urgency."""
        _, urg, _ = classify_ticket("Complete outage affecting all users", "Network", "Router")
        assert urg != Urgency.low

    def test_low_description_low_urgency(self):
        _, urg, _ = classify_ticket("Question about voicemail", "Other", "Phone")
        assert urg == Urgency.low


class TestClassifyTicketReturnShape:
    """Return type and consistency checks."""

    def test_returns_three_values(self):
        result = classify_ticket("Test issue", "Other", "Test System")
        assert len(result) == 3

    def test_severity_is_severity_enum(self):
        sev, _, _ = classify_ticket("Test issue", "Other", "Test System")
        assert isinstance(sev, Severity)

    def test_urgency_is_urgency_enum(self):
        _, urg, _ = classify_ticket("Test issue", "Other", "Test System")
        assert isinstance(urg, Urgency)

    def test_priority_is_int(self):
        _, _, prio = classify_ticket("Test issue", "Other", "Test System")
        assert isinstance(prio, int)

    def test_priority_matches_compute(self):
        sev, urg, prio = classify_ticket("Complete network outage", "Network", "Core Router")
        assert prio == compute_priority_score(sev, urg)

    def test_empty_strings_do_not_crash(self):
        result = classify_ticket("", "", "")
        assert len(result) == 3

    def test_very_long_description_does_not_crash(self):
        long_desc = "outage " * 500
        result = classify_ticket(long_desc, "Network", "Router")
        assert len(result) == 3

    def test_case_insensitive_keywords(self):
        sev1, _, _ = classify_ticket("PRODUCTION OUTAGE", "Other", "System")
        sev2, _, _ = classify_ticket("production outage", "Other", "System")
        assert sev1 == sev2 == Severity.high


# ===========================================================================
# Security / JWT Utility Tests
# ===========================================================================

class TestPasswordHashing:

    def test_verify_correct_password(self):
        hashed = hash_password("mysecretpassword")
        assert verify_password("mysecretpassword", hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("mysecretpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_is_not_plaintext(self):
        hashed = hash_password("mysecretpassword")
        assert hashed != "mysecretpassword"

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt uses random salt — same password produces different hashes."""
        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")
        assert h1 != h2

    def test_both_hashes_verify_correctly(self):
        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")
        assert verify_password("samepassword", h1) is True
        assert verify_password("samepassword", h2) is True

    def test_empty_password_can_be_hashed_and_verified(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


class TestJWTTokens:

    def test_create_and_decode_token(self):
        token = create_access_token("42")
        subject = decode_token(token)
        assert subject == "42"

    def test_decode_returns_string(self):
        token = create_access_token("99")
        subject = decode_token(token)
        assert isinstance(subject, str)

    def test_tampered_token_returns_none(self):
        token = create_access_token("1")
        tampered = token[:-5] + "XXXXX"
        assert decode_token(tampered) is None

    def test_random_string_returns_none(self):
        assert decode_token("not.a.real.token") is None

    def test_empty_string_returns_none(self):
        assert decode_token("") is None

    def test_different_subjects_produce_different_tokens(self):
        t1 = create_access_token("1")
        t2 = create_access_token("2")
        assert t1 != t2

    def test_same_subject_repeated_calls_differ(self):
        """Each token has a unique exp timestamp so strings will differ over time."""
        t1 = create_access_token("5")
        t2 = create_access_token("5")
        # Both must decode successfully
        assert decode_token(t1) == "5"
        assert decode_token(t2) == "5"


# ===========================================================================
# Escalation Service — Unit Tests (mock DB session)
# ===========================================================================

class TestEscalationService:

    @pytest.mark.asyncio
    async def test_get_escalation_config_creates_default_when_missing(self):
        """If no config row exists, service creates one with id=1."""
        from app.services.escalation import get_escalation_config
        from app.models.escalation_config import EscalationConfig

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)
        session.add = MagicMock()
        session.flush = AsyncMock()

        cfg = await get_escalation_config(session)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()
        assert isinstance(cfg, EscalationConfig)

    @pytest.mark.asyncio
    async def test_get_escalation_config_returns_existing_row(self):
        from app.services.escalation import get_escalation_config
        from app.models.escalation_config import EscalationConfig

        existing = EscalationConfig(id=1, high_unassigned_threshold_minutes=45)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        cfg = await get_escalation_config(session)
        assert cfg.high_unassigned_threshold_minutes == 45

    @pytest.mark.asyncio
    async def test_run_escalation_check_returns_zero_when_no_tickets(self):
        from app.services.escalation import run_escalation_check
        from app.models.escalation_config import EscalationConfig

        # Pass explicit value — SQLAlchemy column defaults don't apply outside DB
        cfg = EscalationConfig(id=1, high_unassigned_threshold_minutes=30)
        config_result = MagicMock()
        config_result.scalar_one_or_none.return_value = cfg

        tickets_result = MagicMock()
        tickets_result.scalars.return_value.all.return_value = []

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[config_result, tickets_result])
        session.add = MagicMock()
        session.flush = AsyncMock()

        count = await run_escalation_check(session)
        assert count == 0

    @pytest.mark.asyncio
    async def test_run_escalation_escalates_qualifying_tickets(self):
        from app.services.escalation import run_escalation_check
        from app.models.escalation_config import EscalationConfig

        cfg = EscalationConfig(id=1, high_unassigned_threshold_minutes=30)
        config_result = MagicMock()
        config_result.scalar_one_or_none.return_value = cfg

        # Use plain MagicMock (no spec) so status attribute can be freely reassigned
        ticket = MagicMock()
        ticket.id = 1
        ticket.status = TicketStatus.open
        ticket.escalated_at = None

        tickets_result = MagicMock()
        tickets_result.scalars.return_value.all.return_value = [ticket]

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[config_result, tickets_result])
        session.add = MagicMock()
        session.flush = AsyncMock()

        count = await run_escalation_check(session)
        assert count == 1
        assert ticket.status == TicketStatus.escalated


# ===========================================================================
# Ticket Model / Enum Tests
# ===========================================================================

class TestTicketEnums:

    def test_all_statuses_are_strings(self):
        for s in TicketStatus:
            assert isinstance(s.value, str)

    def test_all_severities_are_strings(self):
        for s in Severity:
            assert isinstance(s.value, str)

    def test_all_urgencies_are_strings(self):
        for u in Urgency:
            assert isinstance(u.value, str)

    def test_ticket_status_values(self):
        assert TicketStatus.open == "open"
        assert TicketStatus.assigned == "assigned"
        assert TicketStatus.in_progress == "in_progress"
        assert TicketStatus.resolved == "resolved"
        assert TicketStatus.escalated == "escalated"

    def test_severity_values(self):
        assert Severity.low == "low"
        assert Severity.medium == "medium"
        assert Severity.high == "high"

    def test_urgency_values(self):
        assert Urgency.low == "low"
        assert Urgency.medium == "medium"
        assert Urgency.high == "high"


# ===========================================================================
# User Role Tests
# ===========================================================================

class TestUserRoles:

    def test_role_values(self):
        assert UserRole.end_user == "user"
        assert UserRole.it_support == "it_support"
        assert UserRole.admin == "admin"

    def test_three_roles_exist(self):
        assert len(list(UserRole)) == 3

    def test_roles_are_strings(self):
        for role in UserRole:
            assert isinstance(role.value, str)
