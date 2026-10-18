# System Design Document

## 1. Design goal

Design a system in which AI can perform useful enterprise reasoning without being the authority that directly executes sensitive actions.

## 2. Architecture

### AI Agent Layer

Responsible for:

- language understanding;
- retrieval;
- comparison;
- planning;
- recommendation;
- structured action proposal.

### Governance and Execution Control Layer

Responsible for:

- runtime request validation;
- identity;
- permissions;
- organisational policy;
- budget/quota;
- risk;
- human approval;
- execution permit;
- audit evidence;
- revocation.

### Enterprise Services Layer

Responsible for business side effects.

The initial service is a synthetic procurement service.

## 3. Major design choices

- modular FastAPI backend;
- separate LangGraph worker;
- PostgreSQL authoritative state;
- Redis transactional coordination;
- OPA/Rego deterministic policy;
- signed short-lived permit;
- protected MCP/REST adapter;
- OpenTelemetry observability;
- deterministic synthetic vendor data for repeatable demo.

## 4. Data flow

```text
User
→ Task
→ Agent plan
→ Candidate retrieval
→ Recommendation
→ Execution proposal
→ Runtime Gateway
→ Identity
→ Permission
→ Policy
→ Risk
→ Budget reservation
→ Approval if needed
→ Permit
→ Protected procurement service
→ Result
→ Audit receipt
```

## 5. Security boundary

The model never receives a credential that can directly invoke the protected procurement side effect.

## 6. Extensibility

New workflows should plug into:

- tool registry;
- action schema;
- permission capability;
- policy rules;
- risk metadata;
- enterprise adapter;
- evaluation scenarios.

The core governance pipeline stays unchanged.
