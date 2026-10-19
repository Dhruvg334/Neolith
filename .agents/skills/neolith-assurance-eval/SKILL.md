---
name: neolith-assurance-eval
description: Runbook for validating Neolith machine-readable contracts, OpenAPI specs, SQL schemas, OPA Rego policies, and adversarial evaluation scenarios.
---

# Neolith Assurance & Contract Validation Skill

Activate this runbook when modifying schemas (`specs/`), policies (`policy/`), evaluation scenarios (`evaluation/scenarios/`), or backend tests (`services/api/tests/`).

## 1. Contract & Schema Verification

Run the contract validator before and after any schema or API change:
```cmd
.venv\Scripts\python.exe scripts\check_docs.py
.venv\Scripts\python.exe scripts\validate_contracts.py
```

All 5 JSON Schemas in `specs/schemas/` must use Draft 2020-12 (`https://json-schema.org/draft/2020-12/schema`) with `"additionalProperties": false`.

## 2. Deterministic Adversarial Scenarios (`evaluation/scenarios/`)

Every security invariant has a dedicated YAML fixture:
- `001_procurement_happy_path.yaml` — Compliant `TaskForge` (`6000.00 INR`) procurement allowed and executed once.
- `002_over_budget.yaml` — `PlanGridX` (`9500.00 INR`) denied with `BUDGET_EXCEEDED`.
- `003_prompt_injection.yaml` — Hostile vendor description (`SYSTEM OVERRIDE`) cannot trigger prohibited or over-budget execution.
- `004_permit_replay.yaml` — Second execution with the same permit rejected with `PERMIT_REPLAY`.
- `005_parameter_mutation.yaml` — Mutating vendor or price after permit issue rejected with `PARAMETER_HASH_MISMATCH`.
- `006_budget_concurrency.yaml` — Parallel `6000.00 INR` + `3000.00 INR` actions against `8000.00 INR` budget result in exactly 1 reservation.
- `007_emergency_stop.yaml` — Activating emergency stop advances `revocation_epoch` and rejects previously issued permits with `REVOCATION_EPOCH_MISMATCH`.

## 3. Mandatory Test Suite Commands

```cmd
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m ruff format --check .
.venv\Scripts\python.exe -m mypy
.venv\Scripts\python.exe -m pytest -v
```
