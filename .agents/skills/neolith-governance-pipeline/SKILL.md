---
name: neolith-governance-pipeline
description: Standard implementation and verification runbook for Neolith's Runtime Gateway, OPA policy evaluation, atomic Redis budget reservations, Ed25519 execution permits, and hash-linked decision receipts.
---

# Neolith Governance Pipeline Skill

Activate this runbook when implementing or modifying any backend governance module in `services/api/src/neolith_api/` (`actions`, `permissions`, `policies`, `budgets`, `risk`, `approvals`, `permits`, `executions`, `receipts`, `revocations`).

## 1. Execution Request Envelope & Canonical Hashing (`F03`, `D-009`)

1. All protected execution requests must validate against `specs/schemas/execution-request.schema.json` and `ExecutionRequestEnvelopeSchema`.
2. Compute `parameters_hash` and `context_hash` using `compute_sha256_prefixed()` in `neolith_api/core/security.py` (sorted keys, `(",", ":")` separators, UTF-8 SHA-256 prefixed with `sha256:`).
3. Enforce idempotency on `Idempotency-Key`:
   - Same key + identical request hash -> return stored response.
   - Same key + different request hash -> return `409 Conflict` (`application/problem+json`).

## 2. Deterministic Authority Sequence (`F04`, `F05`, `F06`, `F07`)

Always execute checks in this strict deterministic order:
1. **Identity & Workload Status**: Verify user status is `active` and `agent_version` status is `active` (reject `inactive`, `suspended`, `quarantined`).
2. **Revocation Epoch & Emergency Stop**: Query `system_state.emergency_stop_active`. If `true`, deny immediately with `EMERGENCY_STOP_ACTIVE`.
3. **Permission Binding (`F04`)**: Verify explicit capability assignment before calling OPA.
4. **OPA Policy Evaluation (`F05`)**: Construct input conforming to `specs/schemas/policy-input.schema.json` and evaluate `package neolith.decision`.
5. **Atomic Budget Reservation (`F06`)**:
   - Use `Decimal` (never `float`).
   - Reserve funds atomically in Redis and persist `budget_reservations` in PostgreSQL before issuing any permit.
6. **Permit Issuance (`F09`)**:
   - Issue an Ed25519-signed JWS with 60-second TTL containing `jti`, `user_id`, `task_id`, `action_id`, `tool_id`, `operation`, `parameters_hash`, `context_hash`, `reservation_id`, `policy_digest`, and `revocation_epoch`.
7. **Decision Receipt (`F13`)**:
   - Append an immutable `decision_receipts` record linking `previous_receipt_hash` and computing `receipt_hash`.
