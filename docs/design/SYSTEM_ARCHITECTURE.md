# System Architecture

## 1. Architecture style

Neolith uses a modular backend with separate agent and policy runtimes.

For the semester prototype:

- one FastAPI application contains core control-plane and governance modules;
- one LangGraph worker executes long-running agent workflows;
- OPA runs separately as deterministic policy engine;
- PostgreSQL is authoritative state;
- Redis handles low-latency reservations, idempotency and revocation state;
- protected enterprise services run as a mock service;
- Next.js provides user and operator interfaces.

This avoids premature microservices while keeping clear boundaries.

## 2. Three-layer academic view

```mermaid
flowchart TB
    U[User / Requester]

    subgraph A[AI Agent Layer]
      A1[Goal Understanding]
      A2[Research / Retrieval]
      A3[Comparison]
      A4[Planning]
      A5[Action Proposal]
    end

    subgraph G[Governance and Execution Control Layer]
      G1[Runtime Gateway]
      G2[Identity Service]
      G3[Permission Validator]
      G4[Policy Engine]
      G5[Budget / Quota Manager]
      G6[Risk Analyzer]
      G7[Approval Manager]
      G8[Permit Service]
      G9[Audit / Receipt Service]
    end

    subgraph E[Enterprise Services Layer]
      E1[Procurement]
      E2[ERP / CRM]
      E3[HR]
      E4[Scheduling]
      E5[External APIs]
    end

    U --> A1 --> A2 --> A3 --> A4 --> A5
    A5 --> G1
    G1 --> G2 --> G3 --> G4 --> G5 --> G6 --> G7 --> G8
    G8 --> E1
    G8 --> E2
    G8 --> E3
    G8 --> E4
    G8 --> E5
    G1 --> G9
    E1 --> G9
```

## 3. Implementation view

```mermaid
flowchart LR
    Browser[Next.js Web App] --> API[FastAPI API]
    AgentClient[LangGraph Primary Agent] --> API

    API --> DB[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> OPA[Open Policy Agent]
    API --> Worker[Agent Worker]
    API --> Adapter[Protected Service Adapter]

    Worker --> LLM[LLM Provider Adapter]
    Worker --> MCP[MCP Read Tools]
    Worker --> DB

    Adapter --> Procurement[Mock Procurement Service]

    API --> OTel[OpenTelemetry]
    Worker --> OTel
    Adapter --> OTel
```

## 4. Backend modules

```text
neolith/
├─ core/
│  ├─ config
│  ├─ security
│  ├─ errors
│  ├─ idempotency
│  └─ telemetry
├─ users/
├─ agents/
├─ tools/
├─ tasks/
├─ permissions/
├─ policies/
├─ budgets/
├─ risk/
├─ approvals/
├─ actions/
├─ permits/
├─ executions/
├─ receipts/
├─ revocations/
├─ incidents/
├─ evaluations/
└─ integrations/
```

## 5. Protected action sequence

```text
Agent proposes action
→ Runtime Gateway validates envelope
→ Agent/workload identity verified
→ Permission checked
→ Policy evaluated by OPA
→ Risk classified
→ Budget/quota reserved if required
→ Human approval if required
→ Decision persisted
→ Signed permit issued
→ Protected service verifies permit
→ Action executes
→ Reservation commits/releases
→ Decision receipt appended
```

## 6. Design boundaries

### AI Agent Layer owns

- language interpretation;
- retrieval;
- comparison;
- plan;
- recommendation;
- proposal.

### Governance Layer owns

- identity;
- permissions;
- policy;
- budget/quota;
- risk thresholding;
- approvals;
- permits;
- revocation;
- evidence.

### Enterprise Service owns

- actual business side effect;
- business-level idempotency;
- result reporting;
- compensation where supported.

## 7. Extension model

A new enterprise workflow should add:

1. new tool/service adapter;
2. permissions;
3. policy rules;
4. action schema;
5. risk classification;
6. evaluation scenarios;
7. UI where necessary.

The governance core should not need redesign.
