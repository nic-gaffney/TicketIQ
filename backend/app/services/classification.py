"""Heuristic ticket classification (MVP stand-in for LLM/NLP per FR-03–FR-06)."""

from app.models.ticket import Severity, Urgency


def compute_priority_score(severity: Severity, urgency: Urgency) -> int:
    return _score_severity_urgency(severity, urgency)


def _score_severity_urgency(severity: Severity, urgency: Urgency) -> int:
    sm = {"low": 1, "medium": 2, "high": 3}
    return sm[severity.value] * 10 + sm[urgency.value]


def classify_ticket(description: str, category: str, affected_system: str) -> tuple[Severity, Urgency, int]:
    text = f"{description} {category} {affected_system}".lower()

    severity = Severity.low
    if any(
        w in text
        for w in (
            "outage",
            "down",
            "critical",
            "production down",
            "all users",
            "data loss",
            "breach",
            "security incident",
            "complete failure",
            "entire network",
        )
    ):
        severity = Severity.high
    elif any(
        w in text
        for w in (
            "error",
            "broken",
            "cannot access",
            "not working",
            "failed",
            "urgent",
            "degraded",
            "slow",
        )
    ):
        severity = Severity.medium

    if category.lower() in ("security", "network") and severity == Severity.low:
        severity = Severity.medium

    urgency = Urgency.low
    if any(
        w in text
        for w in ("asap", "immediately", "right now", "blocking", "p1", "severity 1", "emergency")
    ):
        urgency = Urgency.high
    elif severity == Severity.high or any(w in text for w in ("today", "soon", "business hours", "eod")):
        urgency = Urgency.medium if urgency == Urgency.low else urgency
    if severity == Severity.high and urgency == Urgency.low:
        urgency = Urgency.medium

    priority = _score_severity_urgency(severity, urgency)
    return severity, urgency, priority
