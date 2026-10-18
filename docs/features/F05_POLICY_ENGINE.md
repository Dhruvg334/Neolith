# F05 — Policy Engine

## Purpose

Enforce organisational rules independently of the AI agent.

## Technology

Open Policy Agent / Rego.

## Policy examples

- software procurement must use approved category;
- amount above threshold requires approval;
- blocked vendor cannot be purchased;
- agent may use only registered tools;
- irreversible action requires higher review;
- quarantined agent is denied;
- emergency stop denies protected writes.

## Input

Structured governance context:

- user;
- agent;
- task;
- action;
- tool;
- permission result;
- budget status;
- risk signals;
- environment;
- revocation state.

## Output

```json
{
  "decision": "review",
  "reason_codes": ["AMOUNT_REQUIRES_APPROVAL"],
  "required_approvals": ["project_supervisor"],
  "constraints": {},
  "risk_tier": "R3"
}
```

## Lifecycle

```text
draft
→ validate
→ unit-test
→ simulate
→ approve
→ activate
→ monitor
→ rollback / retire
```

## AI role

A Policy Engineering Agent may draft Rego and tests.

It cannot activate or publish policy.

## Versioning

Every protected action records exact active policy version/bundle digest.

## Acceptance

- deterministic fixture yields identical outcome;
- invalid policy cannot activate;
- lower-level rule cannot override hard deny;
- policy decision is explainable through reason codes.
