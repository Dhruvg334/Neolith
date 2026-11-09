package neolith.decision

import rego.v1

# -----------------------------------------------------------------------------
# Default deny decision envelope
# -----------------------------------------------------------------------------
default result := {
    "decision": "deny",
    "reason_codes": ["DEFAULT_DENY"],
    "required_approvals": [],
    "risk_tier": "R4",
}

# -----------------------------------------------------------------------------
# Decision rules with strict precedence: DENY > REVIEW > ALLOW
# -----------------------------------------------------------------------------
result := {
    "decision": "deny",
    "reason_codes": sort([r | deny_reason[r]]),
    "required_approvals": [],
    "risk_tier": resolved_risk_tier,
} if {
    count({r | deny_reason[r]}) > 0
}

result := {
    "decision": "review",
    "reason_codes": sort([r | review_reason[r]]),
    "required_approvals": ["approver"],
    "risk_tier": resolved_risk_tier,
} if {
    count({r | deny_reason[r]}) == 0
    count({r | review_reason[r]}) > 0
}

result := {
    "decision": "allow",
    "reason_codes": ["BASE_POLICY_ALLOW"],
    "required_approvals": [],
    "risk_tier": resolved_risk_tier,
} if {
    count({r | deny_reason[r]}) == 0
    count({r | review_reason[r]}) == 0
}

# Resolved risk tier from input or fallback to tool tier
resolved_risk_tier := input.tool.risk_tier if {
    input.tool.risk_tier != null
    input.tool.risk_tier != ""
} else := "R2"

# -----------------------------------------------------------------------------
# HARD INVARIANTS: Non-overridable security denials across all profiles
# -----------------------------------------------------------------------------

# Invariant 1: Global emergency stop
deny_reason["EMERGENCY_STOP_ACTIVE"] if {
    input.revocation.emergency_stop_active == true
}

# Invariant 2: Agent status must be active
deny_reason["AGENT_INACTIVE"] if {
    input.agent.status != "active"
}

# Invariant 3: Agent version must be registered
deny_reason["AGENT_VERSION_UNKNOWN"] if {
    input.agent.version_registered == false
}

# Invariant 4: Explicit permission binding must allow action
deny_reason["PERMISSION_MISSING"] if {
    input.permission.allowed != true
}

# Invariant 5: Tool must be explicitly allowed / registered
deny_reason["TOOL_NOT_ALLOWED"] if {
    input.tool.allowed != true
}

deny_reason["TOOL_UNREGISTERED"] if {
    input.tool.registered == false
}

deny_reason["TOOL_INACTIVE"] if {
    input.tool.status != "active"
}

# Invariant 6: Blocked task categories
deny_reason["POLICY_CATEGORY_DENIED"] if {
    input.task.blocked_categories != null
    input.action.category in input.task.blocked_categories
}

# Invariant 7: Hard category budget exhaustion
deny_reason["BUDGET_EXCEEDED"] if {
    input.action.amount != null
    input.budget.remaining != null
    to_number(input.action.amount) > to_number(input.budget.remaining)
}

# Invariant 8: Low objective alignment confidence
deny_reason["OBJECTIVE_MISMATCH"] if {
    input.risk.objective_alignment_confidence != null
    input.risk.objective_alignment_confidence < 0.40
}

# Invariant 9: Unverified beneficiary enforcement
# Applies when beneficiary verification is required by profile or when explicitly unverified
deny_reason["UNVERIFIED_BENEFICIARY"] if {
    input.action.operation in ["pay_invoice", "transfer_funds"]
    input.beneficiary != null
    input.beneficiary.verified == false
}

# Invariant 10: Custom profile maximum action limit breach
deny_reason["MAX_AMOUNT_EXCEEDED"] if {
    input.profile.style == "custom"
    input.profile.configuration.max_action_amount != null
    input.action.amount != null
    to_number(input.action.amount) > to_number(input.profile.configuration.max_action_amount)
}

# -----------------------------------------------------------------------------
# REVIEW CONDITIONS: Evaluated according to active Governance Profile
# -----------------------------------------------------------------------------

# Uncertainty in objective alignment
review_reason["OBJECTIVE_ALIGNMENT_UNCERTAIN"] if {
    input.risk.objective_alignment_confidence != null
    input.risk.objective_alignment_confidence >= 0.40
    input.risk.objective_alignment_confidence < 0.75
}

# Profile Style: Strict Control
# All protected mutating writes require human review regardless of amount
review_reason["STRICT_CONTROL_REVIEW_REQUIRED"] if {
    input.profile.style == "strict"
    input.tool.protected == true
    input.tool.read_only == false
}

# Profile Style: Balanced Control (Default)
# 1. Category approval threshold reached
review_reason["APPROVAL_THRESHOLD_REACHED"] if {
    input.profile.style in ["balanced", null, ""]
    input.action.amount != null
    input.budget.approval_threshold != null
    to_number(input.action.amount) >= to_number(input.budget.approval_threshold)
}

# 2. Elevated risk tier review (R3 / R4)
review_reason["HIGH_RISK_TIER_REVIEW_REQUIRED"] if {
    input.profile.style in ["balanced", null, ""]
    resolved_risk_tier in ["R3", "R4"]
}

# Profile Style: High Autonomy
# R4 (permit-gated / irreversible) actions still require human review
review_reason["CRITICAL_ACTION_REVIEW_REQUIRED"] if {
    input.profile.style == "high_autonomy"
    resolved_risk_tier == "R4"
}

# Profile Style: Custom
# 1. Custom threshold reached
review_reason["CUSTOM_THRESHOLD_REACHED"] if {
    input.profile.style == "custom"
    input.profile.configuration.review_threshold != null
    input.action.amount != null
    to_number(input.action.amount) >= to_number(input.profile.configuration.review_threshold)
}

# 2. Custom action types requiring review
review_reason["CUSTOM_ACTION_REVIEW_REQUIRED"] if {
    input.profile.style == "custom"
    input.profile.configuration.require_review_operations != null
    input.action.operation in input.profile.configuration.require_review_operations
}
