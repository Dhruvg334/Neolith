# Neolith

**AI-Powered Agentic Decision and Execution System**

Neolith is an enterprise-oriented agentic AI system that separates intelligent decision-making from sensitive execution.

The AI layer can understand a user goal, gather information, compare alternatives and prepare an execution plan. A separate Governance and Execution Control Layer independently decides whether a proposed action may execute based on identity, permissions, organisational policy, budgets or quotas, risk, approvals and current system state.

The initial demonstration is a procurement and service-selection workflow. The architecture is designed to extend to HR, finance, scheduling and other enterprise workflows without changing the core governance model.

## Core principle

> Agents may understand, reason and propose. Sensitive execution requires independent authority.

## High-level architecture

```text
User / Enterprise Principal
          |
          v
+---------------------------+
| AI Agent Layer            |
| intent -> research -> plan|
+---------------------------+
          |
          | Execution Request Envelope
          v
+--------------------------------------+
| Governance & Execution Control Layer |
| Identity                             |
| Permissions                          |
| Policy                               |
| Budget / Quota                       |
| Risk                                 |
| Approval                             |
| Execution Permit                     |
| Audit / Decision Receipt             |
+--------------------------------------+
          |
          | short-lived permit
          v
+---------------------------+
| Enterprise Services Layer |
| ERP / CRM / HR / APIs     |
+---------------------------+
```

## Technology direction

- Next.js — operator and user interface
- FastAPI — control plane and runtime API
- PostgreSQL — authoritative state
- Redis — low-latency reservations, idempotency and revocation state
- LangGraph — stateful agent workflows
- Open Policy Agent / Rego — deterministic policy enforcement
- MCP — governed agent-to-tool integration
- A2A — optional agent-to-agent delegation boundary
- OpenTelemetry — traces, metrics and correlation
- Docker — local and hosted deployment
- Git / GitHub — version control and team workflow
- Provider-pluggable LLM adapter — initial implementation may use OpenAI

## Primary demo

A user asks Neolith to identify and procure project-management software under a defined monthly budget.

The agent researches candidate services and prepares a recommendation. Before any procurement action is executed, Neolith independently verifies:

- requester identity;
- purchasing permissions;
- policy eligibility;
- budget availability;
- risk tier;
- approval requirement;
- exact action parameters.

If approved, the runtime issues a short-lived execution permit. The protected enterprise service accepts only valid permitted actions. Every decision and outcome becomes auditable evidence.

## Repository map

- `docs/` — public project documentation
- `docs/features/` — detailed feature descriptions
- `docs/design/` — system architecture and data/API design
- `docs/testing/` — validation and evaluation plans
- `docs/academic/` — semester-project documentation
- `specs/` — machine-readable contracts and runtime prompts
- `policy/` — deterministic policy code
- `evaluation/` — reproducible assurance scenarios
- `infra/` — local infrastructure

## Start here

1. Read `docs/context/00_PROJECT_CONTEXT.md`.
2. Read `docs/academic/SRS.md`.
3. Read `docs/features/00_FEATURE_INDEX.md`.
4. Read `docs/design/SYSTEM_ARCHITECTURE.md`.
5. Follow `docs/IMPLEMENTATION_ROADMAP.md`.

No production credential or real money movement is required for the academic prototype.
