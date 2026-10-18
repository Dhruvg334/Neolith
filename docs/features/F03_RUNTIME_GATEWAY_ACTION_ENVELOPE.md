# F03 — Runtime Gateway and Execution Request Envelope

## Purpose

Create one mandatory entry point for every protected action.

## Why it exists

Without a gateway, each agent or tool integration can implement policy differently. Neolith requires one canonical execution request so identity, permission, policy, budget, risk and approval logic see the same context.

## Envelope fields

- action ID;
- trace ID;
- task ID;
- requester/principal ID;
- agent ID and version;
- authority/mandate ID where applicable;
- delegation ID;
- tool ID/version;
- operation;
- resource;
- category;
- amount/currency where relevant;
- parameters;
- canonical parameter hash;
- context;
- context hash;
- requested timestamp;
- nonce;
- idempotency key.

## Processing

```text
validate schema
→ authenticate workload
→ resolve identity
→ resolve permissions
→ resolve policy context
→ check revocation
→ calculate risk
→ reserve budget/quota if needed
→ decide allow / deny / review
→ persist decision
→ issue permit or approval
→ append receipt
```

## Idempotency

Same idempotency key + same request hash:
return original result.

Same idempotency key + changed request:
reject with conflict.

## API

Primary endpoint:

`POST /api/v1/actions/evaluate`

## Failure modes

- malformed envelope: 422;
- unknown agent: deny;
- policy unavailable: fail closed for protected write;
- budget service unavailable: fail closed for budgeted write;
- semantic risk unavailable: deterministic path continues unless policy requires it.

## Acceptance

- no protected write can be initiated without action evaluation;
- every decision has trace/action ID;
- retries cannot create duplicate reservations or approvals.
