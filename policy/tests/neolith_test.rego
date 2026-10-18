package neolith.decision_test

import data.neolith.decision

base_input := {
    "user": {"id": "u1"},
    "agent": {"status": "active"},
    "task": {"blocked_categories": ["gift_card"]},
    "permission": {"allowed": true},
    "action": {"category": "software", "amount": "6000.00"},
    "tool": {"allowed": true},
    "budget": {"remaining": "8000.00", "approval_threshold": "7000.00"},
    "risk": {"objective_alignment_confidence": 0.95},
    "environment": {},
    "revocation": {"emergency_stop_active": false},
}

test_allow_compliant if {
    decision.result with input as base_input
    decision.result.decision == "allow" with input as base_input
}

test_deny_budget if {
    x := object.union(base_input, {"action": {"category": "software", "amount": "9500.00"}})
    decision.result.decision == "deny" with input as x
}

test_deny_permission if {
    x := object.union(base_input, {"permission": {"allowed": false}})
    decision.result.decision == "deny" with input as x
}

test_deny_stop if {
    x := object.union(base_input, {"revocation": {"emergency_stop_active": true}})
    decision.result.decision == "deny" with input as x
}
