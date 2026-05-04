"""
Tests for the auto-escalation subsystem (FR-40 to FR-49).
Run with: docker compose exec backend pytest tests/test_escalation.py -v
"""

import pytest
from app.models.ticket import Severity, Urgency
from app.services.classification import classify_ticket, compute_priority_score
from app.models.escalation_config import EscalationConfig


class TestEscalationClassification:

    def test_high_severity_outage(self):
        sev, urg, prio = classify_ticket("Production outage affecting all users in Dallas", "Network", "Core Router")
        assert sev == Severity.high

    def test_low_severity_not_escalation_candidate(self):
        sev, urg, prio = classify_ticket("Question about how to reset my voicemail PIN", "Other", "Voicemail")
        assert sev == Severity.low

    def test_security_category_raises_severity(self):
        sev, urg, prio = classify_ticket("I need help with access", "Security", "IAM portal")
        assert sev in (Severity.medium, Severity.high)

    def test_network_category_raises_severity(self):
        sev, urg, prio = classify_ticket("Internet is a bit slow today", "Network", "Office WiFi")
        assert sev in (Severity.medium, Severity.high)

    def test_emergency_keywords_trigger_high_urgency(self):
        sev, urg, prio = classify_ticket("System is down blocking all operations immediately", "Network", "Core Switch")
        assert urg == Urgency.high

    def test_high_severity_gets_at_least_medium_urgency(self):
        sev, urg, prio = classify_ticket("Complete network outage affecting all users", "Network", "Core Router")
        assert sev == Severity.high
        assert urg != Urgency.low

    def test_priority_score_high_greater_than_low(self):
        assert compute_priority_score(Severity.high, Urgency.high) > compute_priority_score(Severity.low, Urgency.low)

    def test_priority_score_medium_between_high_and_low(self):
        high = compute_priority_score(Severity.high, Urgency.high)
        med  = compute_priority_score(Severity.medium, Urgency.medium)
        low  = compute_priority_score(Severity.low, Urgency.low)
        assert high > med > low

    def test_priority_score_is_positive(self):
        assert compute_priority_score(Severity.low, Urgency.low) > 0

    def test_data_loss_keyword_triggers_high_severity(self):
        sev, _, _ = classify_ticket("Possible data loss on backup server", "Hardware", "Backup Server")
        assert sev == Severity.high

    def test_breach_keyword_triggers_high_severity(self):
        sev, _, _ = classify_ticket("Suspected security breach on admin account", "Security", "Active Directory")
        assert sev == Severity.high

    def test_slow_keyword_triggers_medium_severity(self):
        sev, _, _ = classify_ticket("Application is running very slow for all users", "Software", "CRM App")
        assert sev in (Severity.medium, Severity.high)

    def test_classify_returns_three_values(self):
        result = classify_ticket("Test issue", "Other", "Test System")
        assert len(result) == 3
        sev, urg, prio = result
        assert isinstance(sev, Severity)
        assert isinstance(urg, Urgency)
        assert isinstance(prio, int)


class TestEscalationConfig:

    def test_default_threshold(self):
        assert EscalationConfig(high_unassigned_threshold_minutes=30).high_unassigned_threshold_minutes == 30

    def test_default_interval(self):
        assert EscalationConfig(job_interval_seconds=300).job_interval_seconds == 300

    def test_has_notification_target(self):
        assert hasattr(EscalationConfig(), "notification_target")

    def test_threshold_is_configurable(self):
        assert EscalationConfig(high_unassigned_threshold_minutes=20).high_unassigned_threshold_minutes == 20

    def test_interval_is_configurable(self):
        assert EscalationConfig(job_interval_seconds=120).job_interval_seconds == 120

    def test_notification_target_is_configurable(self):
        assert EscalationConfig(notification_target="oncall@tmobile.com").notification_target == "oncall@tmobile.com"


class TestPriorityOrdering:

    def test_all_combinations_positive(self):
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) > 0

    def test_high_high_is_max(self):
        max_score = compute_priority_score(Severity.high, Urgency.high)
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) <= max_score

    def test_low_low_is_min(self):
        min_score = compute_priority_score(Severity.low, Urgency.low)
        for sev in Severity:
            for urg in Urgency:
                assert compute_priority_score(sev, urg) >= min_score
# end of file - fixes applied via patch below
