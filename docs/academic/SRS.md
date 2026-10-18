# Software Requirements Specification (SRS)

## Neolith — AI-Powered Agentic Decision and Execution System

**Document status:** Implementation baseline  
**Project category:** 7th-semester major group project

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional, non-functional, security, data, interface, evaluation and acceptance requirements for Neolith.

Neolith is an agentic AI system that can understand user goals, gather information, compare alternatives and produce execution plans while keeping sensitive operations under an independent Governance and Execution Control Layer.

### 1.2 Scope

Neolith shall support enterprise-style workflows in which an AI agent proposes actions but cannot directly execute protected operations.

The prototype shall demonstrate procurement/service selection. The architecture shall remain extensible to HR, finance, scheduling and other enterprise workflows.

### 1.3 Product goals

1. Convert user goals into structured tasks and plans.
2. Gather and compare relevant information.
3. Validate sensitive actions independently of the model.
4. Enforce identity, permissions, policy, budget/quota, risk and approval requirements.
5. Gate protected execution using short-lived execution permits.
6. Maintain complete audit evidence.
7. Support observable and reproducible agent workflows.
8. Remain modular and extensible.

### 1.4 Out of scope for the initial prototype

- real financial transactions;
- real enterprise production credentials;
- regulatory certification;
- autonomous production policy changes;
- unrestricted long-term personal memory;
- arbitrary uncontrolled browser automation;
- full distributed multi-region deployment.

---

## 2. Overall Description

### 2.1 Product perspective

Neolith contains three top-level layers:

1. AI Agent Layer.
2. Governance and Execution Control Layer.
3. Enterprise Services Layer.

The agent layer proposes. The governance layer authorises. The enterprise layer executes only approved actions.

### 2.2 User classes

#### End User / Requester
Submits a natural-language task and receives recommendation, status, approval requests and final result.

#### Operator / Administrator
Registers agents and tools, configures policy, monitors activity, manages permissions and handles incidents.

#### Approver
Reviews actions requiring human approval.

#### Auditor / Reviewer
Reads immutable decision and execution evidence.

#### Developer
Integrates new agents, tools, services, policies and evaluation cases.

### 2.3 Operating environment

Prototype:

- modern web browser;
- Next.js frontend;
- FastAPI backend;
- PostgreSQL;
- Redis;
- OPA;
- LangGraph worker;
- Docker;
- local or hosted LLM API;
- mock enterprise services.

### 2.4 Constraints

- no real purchase shall be made;
- protected actions must not trust agent output as authority;
- money values must not use floating-point arithmetic;
- external content must be treated as untrusted;
- sensitive credentials must remain server-side;
- evaluation must be reproducible;
- repository must not expose private project memory or secrets.

### 2.5 Assumptions

- users and agents have registered identities;
- enterprise services can be placed behind a protected adapter;
- organisational policies can be represented in deterministic form;
- synthetic data is acceptable for the semester prototype;
- model access may be unavailable during CI, so deterministic tests must not require a paid API key.

---

## 3. Functional Requirements

Priority:

- P0 — required for first complete prototype.
- P1 — required for strong final demonstration.
- P2 — extension.

### 3.1 User task intake

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-001 | P0 | User shall submit a natural-language goal. | Request stored with task ID. |
| FR-002 | P0 | Agent shall extract objective, constraints and missing information. | Structured task state created. |
| FR-003 | P1 | Agent shall ask for essential missing information. | It does not invent mandatory budget/authority facts. |
| FR-004 | P0 | User shall see current task state. | UI shows planning, awaiting approval, executing, completed or failed. |

### 3.2 Agent planning and research

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-005 | P0 | Agent shall create a structured plan. | Plan contains ordered steps and expected tools. |
| FR-006 | P0 | Agent shall retrieve vendor/service information from approved sources. | Results include source identifiers. |
| FR-007 | P0 | Agent shall compare alternatives against user constraints. | Recommendation includes structured comparison. |
| FR-008 | P1 | Agent shall revise plan after tool result or denial. | State transition is traceable. |
| FR-009 | P1 | Agent shall distinguish external content from instructions. | Prompt-injection fixture does not alter authority. |

### 3.3 Runtime Gateway

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-010 | P0 | All protected execution requests shall pass through Runtime Gateway. | Direct protected write is rejected. |
| FR-011 | P0 | Gateway shall normalise requests into Execution Request Envelope. | Contract validates against schema. |
| FR-012 | P0 | Gateway shall assign trace and action identifiers. | IDs correlate all downstream evidence. |
| FR-013 | P0 | Gateway shall support idempotency. | Same key + same request returns same result. |
| FR-014 | P0 | Same idempotency key with changed request shall fail. | Conflict returned. |

### 3.4 Identity and permissions

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-015 | P0 | System shall authenticate user/operator. | Invalid credentials rejected. |
| FR-016 | P0 | System shall authenticate agent/workload identity. | Unknown agent version rejected. |
| FR-017 | P0 | Permission Validator shall check requested action. | Missing privilege returns structured deny. |
| FR-018 | P1 | Roles shall include user, operator, approver, auditor and developer. | Role-restricted APIs enforce access. |
| FR-019 | P1 | Agent state shall support active, suspended and quarantined. | Quarantined agent cannot request protected action. |

### 3.5 Policy Engine

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-020 | P0 | Organisational policies shall be evaluated deterministically. | OPA decision stored. |
| FR-021 | P0 | Policy decision shall produce structured reason codes. | No policy denial depends only on prose. |
| FR-022 | P1 | Policies shall be versioned. | Action references exact policy version. |
| FR-023 | P1 | Candidate policy shall support tests before activation. | Invalid candidate cannot activate. |
| FR-024 | P2 | Candidate policy shall support shadow simulation. | Changed decisions are reported. |

### 3.6 Budget and quota management

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-025 | P0 | Procurement actions shall be checked against budget. | Over-budget proposal denied. |
| FR-026 | P0 | Budget shall be reserved atomically before protected execution. | Concurrent overspend test records zero overshoot. |
| FR-027 | P0 | Successful execution shall commit reservation. | Committed amount visible. |
| FR-028 | P0 | Confirmed failed execution shall release reservation. | Available amount restored. |
| FR-029 | P1 | Unknown execution outcome shall enter reconciliation. | Reservation remains protected until resolved. |
| FR-030 | P2 | System shall support non-financial quotas. | API supports count/time/resource quota type. |

### 3.7 Risk analysis

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-031 | P0 | Each protected action shall have risk tier. | Tier stored in decision. |
| FR-032 | P0 | Deterministic risk factors shall include action type, reversibility and amount where relevant. | Same input yields same base risk. |
| FR-033 | P1 | Semantic alignment may add risk signal. | Signal cannot broaden permission. |
| FR-034 | P1 | Anomaly detection may add risk signal. | Signal is separately logged. |
| FR-035 | P0 | High-risk actions may require approval. | Approval workflow triggered. |

### 3.8 Human approval

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-036 | P1 | System shall create approval request for policy-defined actions. | Approver sees exact action. |
| FR-037 | P1 | Approval shall bind exact request hash. | Changed request invalidates approval. |
| FR-038 | P1 | Approval shall expire. | Expired approval cannot issue permit. |
| FR-039 | P1 | Approver shall approve or reject with optional note. | Decision appears in audit evidence. |

### 3.9 Execution permits

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-040 | P0 | Approved protected action shall receive signed short-lived permit. | Valid JWS returned. |
| FR-041 | P0 | Permit shall bind exact tool, operation and parameters. | Mutation rejected. |
| FR-042 | P0 | Permit shall be single-use. | Replay rejected. |
| FR-043 | P0 | Permit shall include expiry. | Expired permit rejected. |
| FR-044 | P1 | Permit shall bind current revocation epoch. | Old permit fails after emergency stop. |

### 3.10 Enterprise service execution

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-045 | P0 | Protected service shall validate permit before execution. | Permitless call never reaches business logic. |
| FR-046 | P0 | Service shall report execution outcome. | Result linked to action. |
| FR-047 | P1 | Service metadata shall declare reversibility. | UI shows reversible/compensatable/irreversible. |
| FR-048 | P1 | Compensatable action shall support mock rollback. | Compensation result recorded. |

### 3.11 Audit and receipts

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-049 | P0 | Every protected action attempt shall create audit evidence. | Allowed and denied actions appear. |
| FR-050 | P0 | Decision Receipt shall include requester, agent, policy, risk and execution evidence. | Receipt validates against schema. |
| FR-051 | P1 | Receipts shall be hash-linked. | Modified receipt fails verification. |
| FR-052 | P1 | Auditor shall verify receipt chain. | UI displays integrity result. |
| FR-053 | P1 | User-facing explanation shall be redacted appropriately. | User does not see internal secrets. |

### 3.12 Revocation and emergency controls

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-054 | P1 | Operator shall quarantine agent. | New protected action denied. |
| FR-055 | P1 | Operator shall revoke task/authority. | Further execution rejected. |
| FR-056 | P1 | Operator shall trigger global demo stop. | Revocation epoch advances. |
| FR-057 | P1 | Existing old permits shall fail after stop. | Adapter rejects epoch mismatch. |
| FR-058 | P1 | Restore shall require explicit operator action. | Stop does not auto-clear. |

### 3.13 Observability

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-059 | P0 | Every task/action shall have trace correlation. | UI can navigate from task to action trace. |
| FR-060 | P0 | System shall emit structured logs. | Required identifiers present. |
| FR-061 | P1 | System shall expose runtime metrics. | Dashboard shows decision latency and counts. |
| FR-062 | P1 | Model calls shall record model/prompt version and usage metadata. | Trace shows version metadata. |

### 3.14 Evaluation

| ID | Priority | Requirement | Acceptance criterion |
|---|---:|---|---|
| FR-063 | P1 | System shall run named evaluation scenarios. | Run persists expected and actual. |
| FR-064 | P1 | Deterministic security invariants shall have exact evaluators. | Pass/fail independent of model judge. |
| FR-065 | P1 | Agent quality shall be evaluated separately from governance correctness. | Report has separate sections. |
| FR-066 | P1 | Critical regressions shall block release. | CI/QA gate fails. |

---

## 4. External Interface Requirements

### 4.1 User interface

Required views:

- Task Workspace.
- Recommendation Comparison.
- Approval Queue.
- Governance Decision Detail.
- Audit / Receipt Explorer.
- Operator Dashboard.
- Policy Management.
- Evaluation / Assurance.

### 4.2 API

REST/JSON core API under `/api/v1`.

Machine-readable OpenAPI is maintained in `specs/openapi.yaml`.

### 4.3 Agent tool interface

MCP is preferred for agent-facing tool exposure.

Protected writes remain behind Neolith permit validation.

### 4.4 Agent-to-agent interface

A2A or internal LangGraph delegation may be used where a specialist agent provides clear value.

### 4.5 Database

PostgreSQL is authoritative.

Redis is transient/coordination state only.

---

## 5. Non-Functional Requirements

### NFR-001 Security
Deny by default for protected actions.

### NFR-002 Performance
Target deterministic governance decision p95 below 150 ms in local prototype, excluding optional semantic model calls.

### NFR-003 Reliability
Core governance shall continue deterministic checks when optional LLM analysis is unavailable.

### NFR-004 Auditability
No hidden reasoning is required to reconstruct a decision.

### NFR-005 Privacy
Do not store raw payment credentials or unnecessary personal data.

### NFR-006 Maintainability
Typed Python and TypeScript, migrations, versioned policies and automated tests.

### NFR-007 Portability
LLM provider is behind adapter; core enforcement does not depend on one model vendor.

### NFR-008 Accessibility
Operator UI targets WCAG 2.1 AA.

### NFR-009 Cost discipline
Routine deterministic governance shall not require an LLM call.

### NFR-010 Testability
CI must run without paid model credentials.

---

## 6. Data Requirements

Authoritative entities:

- User / Principal.
- Agent.
- Agent Version.
- Tool.
- Tool Version.
- Task.
- Plan.
- Permission.
- Policy.
- Budget / Quota.
- Budget Reservation.
- Execution Request.
- Risk Signal.
- Approval.
- Execution Permit.
- Tool Execution.
- Decision Receipt.
- Revocation.
- Incident.
- Evaluation Suite / Case / Run / Result.

Money shall use decimal numeric types.

---

## 7. Security Requirements

- server-side secret storage;
- short-lived workload identity;
- role-based operator access;
- deterministic policy enforcement;
- request canonicalisation and hashing;
- permit signature verification;
- replay protection;
- parameter mutation protection;
- revocation re-check at execution;
- audit integrity;
- prompt-injection tests;
- cross-tenant isolation if multi-tenancy is enabled.

---

## 8. Primary Acceptance Demonstration

The final system should demonstrate:

1. user submits procurement goal;
2. agent researches deterministic vendor catalogue;
3. agent compares options and recommends one;
4. governance accepts compliant choice;
5. budget reservation succeeds;
6. permit is issued;
7. mock procurement executes;
8. receipt is shown;
9. injected vendor content does not alter authority;
10. over-budget action is rejected;
11. permit mutation/replay is rejected;
12. operator quarantine or stop invalidates later execution.

---

## 9. Requirements Traceability

| Objective | Main requirements | Main test |
|---|---|---|
| Agent converts goals to tasks | FR-001–009 | procurement happy path |
| Independent governance | FR-010–024 | direct bypass and policy tests |
| Validate budget/risk | FR-025–035 | budget and risk suites |
| Human control | FR-036–039, FR-054–058 | approval and stop tests |
| Controlled execution | FR-040–048 | permit mutation/replay |
| Complete audit | FR-049–053 | receipt integrity |
| Modular/extensible | interfaces + NFR-006/007 | adapter replacement tests |
| Safe agentic behaviour | FR-009, FR-033/034, FR-063–066 | adversarial suite |
