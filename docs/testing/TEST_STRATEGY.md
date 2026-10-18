# Test Strategy

## Test layers

### Unit tests

Backend:

- request canonicalisation;
- money/Decimal handling;
- permission resolution;
- policy input construction;
- budget arithmetic;
- permit signing/verification;
- receipt hashing;
- state transitions.

Frontend:

- task-state rendering;
- approval forms;
- decision status;
- error states.

### Policy tests

OPA/Rego fixtures:

- allowed procurement;
- blocked category;
- over-budget request;
- approval threshold;
- quarantined agent;
- emergency stop.

### Integration tests

- FastAPI + PostgreSQL;
- FastAPI + Redis;
- FastAPI + OPA;
- FastAPI + tool simulator;
- agent worker + API;
- permit consume;
- receipt append;
- revocation.

### Concurrency tests

- simultaneous budget reservations;
- same idempotency key race;
- same permit replay race;
- stop during pending execution.

### End-to-end

- user task to recommendation;
- governance allow;
- procurement execution;
- denied path;
- approval path;
- receipt verification.

## Mandatory adversarial tests

- prompt injection in vendor description;
- tool-description injection;
- unsupported tool;
- agent version spoofing;
- permission escalation;
- budget race;
- permit mutation;
- permit replay;
- stale/expired permit;
- approval hash mismatch;
- emergency stop;
- receipt tampering.

## CI rule

CI must not require live LLM credentials.

Use deterministic agent fixtures or mocked provider responses for core tests.

## Manual test convention

Every implementation phase shall provide:

- exact input values;
- exact click/API steps;
- expected state;
- expected response/reason code;
- expected database/evidence result.

Use Windows Command Prompt-compatible commands when sharing manual developer instructions.

Use:

```cmd
python -m pytest
```

rather than bare `pytest`.
