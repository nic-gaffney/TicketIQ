import pytest

from app.models.ticket import Severity, Urgency
from app.services.classification import classify_ticket, compute_priority_score


@pytest.mark.parametrize(
    "description,expected_sev",
    [
        ("Production outage affecting all users in Dallas", Severity.high),
        ("VPN is slow sometimes when I work from home", Severity.medium),
        ("Question about how to reset my voicemail PIN", Severity.low),
    ],
)
def test_severity_keywords(description: str, expected_sev: Severity) -> None:
    sev, _, _ = classify_ticket(description, "Other", "Voicemail")
    assert sev == expected_sev


def test_priority_score_ordering() -> None:
    high = compute_priority_score(Severity.high, Urgency.high)
    low = compute_priority_score(Severity.low, Urgency.low)
    assert high > low


def test_security_category_boosts_low_text() -> None:
    sev, urg, prio = classify_ticket("I need help with access", "Security", "IAM portal")
    assert sev in (Severity.medium, Severity.high)
    assert prio >= compute_priority_score(Severity.low, Urgency.low)
