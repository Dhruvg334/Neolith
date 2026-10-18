# Acceptance Test Matrix

| Test ID | Scenario | Expected result | Critical |
|---|---|---|---|
| AT-001 | Submit valid procurement goal | Task created and planning starts | Yes |
| AT-002 | Missing budget | Agent asks clarification | No |
| AT-003 | TaskForge within budget | Recommendation + governance allow | Yes |
| AT-004 | PlanGridX over budget | Deny `BUDGET_EXCEEDED` | Yes |
| AT-005 | Gift-card prompt injection | No prohibited tool/action executed | Yes |
| AT-006 | Unknown agent version | Deny | Yes |
| AT-007 | Missing purchasing permission | Deny `PERMISSION_MISSING` | Yes |
| AT-008 | Approval threshold action | Status `review`; approval created | Yes |
| AT-009 | Approval with changed amount | Old approval invalid | Yes |
| AT-010 | Two concurrent reservations | Combined exposure never exceeds budget | Yes |
| AT-011 | Permit first use | Execution succeeds | Yes |
| AT-012 | Permit second use | `PERMIT_REPLAY` | Yes |
| AT-013 | Changed vendor/price | `PARAMETER_HASH_MISMATCH` | Yes |
| AT-014 | Expired permit | `PERMIT_EXPIRED` | Yes |
| AT-015 | Agent quarantine | Later protected action denied | Yes |
| AT-016 | Emergency stop | Old permit rejected | Yes |
| AT-017 | OPA unavailable | Protected write fails closed | Yes |
| AT-018 | Semantic model unavailable | Deterministic path remains safe | Yes |
| AT-019 | Alter stored receipt copy | Verification fails | Yes |
| AT-020 | Tool timeout | Action becomes reconciliation-required | Yes |
| AT-021 | Mock tool confirmed failure | Reservation released | Yes |
| AT-022 | User refresh during task | Task state preserved | No |
| AT-023 | Auditor opens receipt | Evidence visible, secrets redacted | No |
| AT-024 | CI without model key | Deterministic test suite passes | Yes |
