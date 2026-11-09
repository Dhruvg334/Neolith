package neolith.decision_test

import rego.v1
import data.neolith.decision

base_input := {
    "user": {"id": "u1"},
    "agent": {"status": "active", "version_registered": true},
    "task": {"blocked_categories": ["gift_card"]},
    "permission": {"allowed": true},
    "action": {"operation": "pay_invoice", "category": "software", "amount": "6000.00"},
    "tool": {
        "allowed": true,
        "registered": true,
        "status": "active",
        "risk_tier": "R2",
        "protected": true,
        "read_only": false,
    },
    "beneficiary": {"verified": true},
    "budget": {"remaining": "25000.00", "approval_threshold": "15000.00"},
    "profile": {"style": "balanced"},
    "risk": {"objective_alignment_confidence": 0.95},
    "environment": {},
    "revocation": {"emergency_stop_active": false},
}

# --- Base Tests ---

test_allow_compliant if {
    res := decision.result with input as base_input
    res.decision == "allow"
}

test_deny_budget if {
    x := object.union(base_input, {"action": {"operation": "pay_invoice", "category": "software", "amount": "30000.00"}})
    res := decision.result with input as x
    res.decision == "deny"
    "BUDGET_EXCEEDED" in res.reason_codes
}

test_deny_permission if {
    x := object.union(base_input, {"permission": {"allowed": false}})
    res := decision.result with input as x
    res.decision == "deny"
    "PERMISSION_MISSING" in res.reason_codes
}

test_deny_stop if {
    x := object.union(base_input, {"revocation": {"emergency_stop_active": true}})
    res := decision.result with input as x
    res.decision == "deny"
    "EMERGENCY_STOP_ACTIVE" in res.reason_codes
}

test_deny_inactive_agent if {
    x := object.union(base_input, {"agent": {"status": "inactive", "version_registered": true}})
    res := decision.result with input as x
    res.decision == "deny"
    "AGENT_INACTIVE" in res.reason_codes
}

test_deny_unknown_agent_version if {
    x := object.union(base_input, {"agent": {"status": "active", "version_registered": false}})
    res := decision.result with input as x
    res.decision == "deny"
    "AGENT_VERSION_UNKNOWN" in res.reason_codes
}

test_deny_unregistered_tool if {
    x := object.union(base_input, {"tool": {"allowed": true, "registered": false, "status": "active", "risk_tier": "R2"}})
    res := decision.result with input as x
    res.decision == "deny"
    "TOOL_UNREGISTERED" in res.reason_codes
}

test_deny_inactive_tool if {
    x := object.union(base_input, {"tool": {"allowed": true, "registered": true, "status": "inactive", "risk_tier": "R2"}})
    res := decision.result with input as x
    res.decision == "deny"
    "TOOL_INACTIVE" in res.reason_codes
}

# --- Canonical Reference Scenarios under Balanced Control ---

# CASE A: INV-001 (Acme Cloud, INR 8,000, software, verified, budget 25,000, threshold 15,000) => ALLOW
test_canonical_case_a_inv_001_allow if {
    inv_001_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "software", "amount": "8000.00"},
        "beneficiary": {"verified": true},
        "budget": {"remaining": "25000.00", "approval_threshold": "15000.00"},
        "profile": {"style": "balanced"},
    })
    res := decision.result with input as inv_001_input
    res.decision == "allow"
    "BASE_POLICY_ALLOW" in res.reason_codes
}

# CASE B: INV-002 (Nova Compute, INR 35,000, infrastructure, verified, budget 50,000, threshold 25,000) => REVIEW
test_canonical_case_b_inv_002_review if {
    inv_002_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "infrastructure", "amount": "35000.00"},
        "beneficiary": {"verified": true},
        "budget": {"remaining": "50000.00", "approval_threshold": "25000.00"},
        "profile": {"style": "balanced"},
    })
    res := decision.result with input as inv_002_input
    res.decision == "review"
    "APPROVAL_THRESHOLD_REACHED" in res.reason_codes
    not "BUDGET_EXCEEDED" in res.reason_codes
}

# CASE C: INV-003 (Unknown Supplies, INR 75,000, misc, unverified, budget 10,000) => DENY (both reasons)
test_canonical_case_c_inv_003_deny if {
    inv_003_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "miscellaneous", "amount": "75000.00"},
        "beneficiary": {"verified": false},
        "budget": {"remaining": "10000.00", "approval_threshold": "5000.00"},
        "profile": {"style": "balanced"},
    })
    res := decision.result with input as inv_003_input
    res.decision == "deny"
    "BUDGET_EXCEEDED" in res.reason_codes
    "UNVERIFIED_BENEFICIARY" in res.reason_codes
}

# --- Governance Profile Style Tests ---

# Strict Control requires REVIEW for all protected mutating writes regardless of threshold
test_strict_control_requires_review if {
    strict_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "software", "amount": "1000.00"},
        "budget": {"remaining": "25000.00", "approval_threshold": "15000.00"},
        "profile": {"style": "strict"},
        "tool": {"allowed": true, "registered": true, "status": "active", "risk_tier": "R2", "protected": true, "read_only": false},
    })
    res := decision.result with input as strict_input
    res.decision == "review"
    "STRICT_CONTROL_REVIEW_REQUIRED" in res.reason_codes
}

# High Autonomy allows verified R2 actions within budget
test_high_autonomy_allows_within_budget if {
    high_auto_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "software", "amount": "20000.00"},
        "budget": {"remaining": "50000.00", "approval_threshold": "15000.00"},
        "profile": {"style": "high_autonomy"},
        "tool": {"allowed": true, "registered": true, "status": "active", "risk_tier": "R2", "protected": true, "read_only": false},
    })
    res := decision.result with input as high_auto_input
    res.decision == "allow"
}

# High Autonomy requires REVIEW for critical R4 actions
test_high_autonomy_reviews_r4 if {
    r4_input := object.union(base_input, {
        "action": {"operation": "add_beneficiary", "category": "banking", "amount": null},
        "profile": {"style": "high_autonomy"},
        "tool": {"allowed": true, "registered": true, "status": "active", "risk_tier": "R4", "protected": true, "read_only": false},
    })
    res := decision.result with input as r4_input
    res.decision == "review"
    "CRITICAL_ACTION_REVIEW_REQUIRED" in res.reason_codes
}

# Custom Profile threshold review
test_custom_profile_threshold if {
    custom_input := object.union(base_input, {
        "action": {"operation": "pay_invoice", "category": "software", "amount": "12000.00"},
        "profile": {
            "style": "custom",
            "configuration": {
                "review_threshold": "10000.00",
                "max_action_amount": "50000.00",
                "require_review_operations": ["transfer_funds"],
            },
        },
    })
    res := decision.result with input as custom_input
    res.decision == "review"
    "CUSTOM_THRESHOLD_REACHED" in res.reason_codes
}
