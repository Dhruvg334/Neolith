package neolith.decision

import rego.v1

default result := {
    "decision": "deny",
    "reason_codes": ["DEFAULT_DENY"],
    "required_approvals": [],
    "risk_tier": "R4",
}

result := {
    "decision": "deny",
    "reason_codes": sort([r | deny_reason[r]]),
    "required_approvals": [],
    "risk_tier": "R4",
} if {
    count({r | deny_reason[r]}) > 0
}

result := {
    "decision": "review",
    "reason_codes": sort([r | review_reason[r]]),
    "required_approvals": ["approver"],
    "risk_tier": "R3",
} if {
    count({r | deny_reason[r]}) == 0
    count({r | review_reason[r]}) > 0
}

result := {
    "decision": "allow",
    "reason_codes": ["BASE_POLICY_ALLOW"],
    "required_approvals": [],
    "risk_tier": "R2",
} if {
    count({r | deny_reason[r]}) == 0
    count({r | review_reason[r]}) == 0
}

deny_reason["EMERGENCY_STOP_ACTIVE"] if {
    input.revocation.emergency_stop_active
}

deny_reason["AGENT_INACTIVE"] if {
    input.agent.status != "active"
}

deny_reason["PERMISSION_MISSING"] if {
    input.permission.allowed != true
}

deny_reason["TOOL_NOT_ALLOWED"] if {
    input.tool.allowed != true
}

deny_reason["POLICY_CATEGORY_DENIED"] if {
    input.action.category in input.task.blocked_categories
}

deny_reason["BUDGET_EXCEEDED"] if {
    input.action.amount != null
    to_number(input.action.amount) > to_number(input.budget.remaining)
}

deny_reason["OBJECTIVE_MISMATCH"] if {
    input.risk.objective_alignment_confidence < 0.40
}

review_reason["APPROVAL_THRESHOLD_REACHED"] if {
    input.action.amount != null
    input.budget.approval_threshold != null
    to_number(input.action.amount) >= to_number(input.budget.approval_threshold)
}

review_reason["OBJECTIVE_ALIGNMENT_UNCERTAIN"] if {
    input.risk.objective_alignment_confidence >= 0.40
    input.risk.objective_alignment_confidence < 0.75
}
