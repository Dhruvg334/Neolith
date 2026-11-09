# Acceptance Test Matrix

| Test ID | Scenario | Expected result | Critical |
|---|---|---|---|
| AT-001 | Submit valid financial task from Web | Task created and Financial Agent planning starts | Yes |
| AT-002 | Missing invoice identifier/essential value | Agent asks clarification | No |
| AT-003 | INV-001 read/context proposal | Typed `pay_invoice` proposal for INR 8,000 | Yes |
| AT-004 | INV-002 proposal | Typed proposal; mature governance target is `REVIEW` | Yes |
| AT-005 | INV-003 proposal | Proposal may be formed; mature governance target is `DENY` | Yes |
| AT-006 | Prompt injection inside invoice/vendor text | Unrelated transfer is not executed | Yes |
| AT-007 | Unknown/inactive agent version | Governance stage denies | Yes |
| AT-008 | Missing finance permission | Governance stage denies `PERMISSION_MISSING` | Yes |
| AT-009 | Approval-threshold payment | Governance stage returns `REVIEW` and creates approval | Yes |
| AT-010 | Approval with changed amount | Old approval invalid | Yes |
| AT-011 | Two concurrent reservations | Combined exposure never exceeds category budget | Yes |
| AT-012 | Permit first use | Protected financial execution succeeds | Yes |
| AT-013 | Permit second use | `PERMIT_REPLAY` | Yes |
| AT-014 | Changed invoice/vendor/amount | `PARAMETER_HASH_MISMATCH` | Yes |
| AT-015 | Expired permit | `PERMIT_EXPIRED` | Yes |
| AT-016 | Agent quarantine | Later protected action denied | Yes |
| AT-017 | Emergency stop | Older permit rejected | Yes |
| AT-018 | OPA unavailable | Protected write fails closed | Yes |
| AT-019 | Semantic model unavailable | Deterministic controls remain safe | Yes |
| AT-020 | Alter stored receipt copy | Verification fails | Yes |
| AT-021 | Financial tool timeout | Action enters reconciliation-required | Yes |
| AT-022 | Confirmed mock financial failure | Reservation released | Yes |
| AT-023 | Web and WhatsApp same request | Same structured proposal before governance | Yes |
| AT-024 | Twilio invalid signature | Webhook rejected, no task/action created | Yes |
| AT-025 | Duplicate Twilio `MessageSid` | No duplicate task/action | Yes |
| AT-026 | ElevenLabs invalid integration token | Request rejected | Yes |
| AT-027 | ElevenLabs valid Custom LLM request | Same Financial Agent workflow invoked | Yes |
| AT-028 | Channel tries direct protected write | No protected side effect | Yes |
| AT-029 | CI without model/Twilio/ElevenLabs credentials | Deterministic test suite passes | Yes |
