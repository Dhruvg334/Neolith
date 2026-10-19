# Neolith — Engineering Rulebook & Enterprise Feature Synthesis

This rulebook defines the engineering standards, architectural invariants, practitioner feedback synthesis across features `F01`–`F16`, and execution rules for **Neolith (AI-Powered Agentic Decision and Execution System)**.

---

## 1. Core Architectural Mandate (12-Layer Agentic System Standard)

Neolith is an **enterprise software system with embedded agentic AI**, not an LLM wrapper. Every feature implementation must respect the separation of duties across the 12 production layers:

| Layer | Neolith Subsystem | Authority Boundary |
|---|---|---|
| 1. Interface | `apps/web` (Next.js 15 App Router, `src/components/ui`) | Presents task state, comparisons, approvals, and receipts; never fabricates governance state. |
| 2. Agent Orchestration | `services/agent-worker` (LangGraph state machine) | Understands goals, retrieves candidates, compares options, and proposes actions. Holds **zero** execution authority. |
| 3. Deterministic Domain Core | `services/api` (`permissions`, `policies`, `budgets`, `permits`) | Owns identity, permissions, policy evaluation, budget math, permit signing, and revocation. |
| 4. Context & Memory | `tasks`, `plans`, LangGraph checkpoints | Working memory is task continuity only; memory and retrieved text **never** grant permission or budget. |
| 5. Data Foundation | PostgreSQL 17 (`specs/sql/schema.sql`) + Redis 7 | PostgreSQL is authoritative state; Redis handles atomic low-latency reservations, nonces, and revocation epochs. |
| 6. Tool Integration | `services/tool-simulator` + MCP read tools (`F10`) | Read tools retrieve grounded data; protected writes require a valid signed Execution Permit (`F09`). |
| 7. Human Checkpoints | `approvals` (`F08`) | Pauses agent workflow via durable checkpoint and binds human sign-off to the exact `sha256` request hash. |
| 8. Model Routing | `LLMProviderAdapter` (`provider.py`) | Vendor-neutral adapter supporting OpenAI in runtime and `DeterministicMockLLMProvider` in CI. |
| 9. Testing & Evaluation | `evaluation/scenarios/` + `services/api/tests/` (`F15`) | Separates agent recommendation quality from deterministic security/governance correctness. |
| 10. Security & Access Control | Workload tokens, RBAC/ABAC, Ed25519 JWS (`F04`, `F09`) | Deny-by-default; server-side secrets; RFC 8785 canonical JSON hashing (`core/security.py`). |
| 11. Observability & Telemetry | OpenTelemetry (`core/telemetry.py`) + Jaeger (`F14`) | End-to-end `X-Trace-Id` correlation from user task to enterprise execution and receipt. |
| 12. Audit & Continuity | `receipts`, `incidents` (`F13`) | Append-only SHA-256 hash-linked decision receipts and incident timelines. |

---

## 2. Non-Negotiable Product Invariants

1. **Intelligence vs. Authority (`P1`)**: The AI agent may understand, retrieve, compare, plan, and propose. It may never grant permissions, edit policy, increase budgets, approve actions, or issue permits.
2. **Mandatory Runtime Gateway (`P2`, `F03`)**: Every protected write must enter through `POST /api/v1/actions/evaluate` wrapped in a canonical Execution Request Envelope.
3. **Deterministic Dominance (`P3`)**: An LLM output or semantic score can raise risk or trigger human review, but can **never** convert a deterministic denial into an allow.
4. **Exact Decimal Arithmetic (`P6`, `F06`)**: Monetary values must use decimal strings (`"6000.00"`) at the API boundary, `Decimal` in Python, `numeric(18,2)` in PostgreSQL, and `BigInt` minor units in TypeScript UI components. Binary floating-point (`float`) is strictly prohibited for money.
5. **Atomic Pre-Execution Budget Reservation (`P6`, `F06`)**: Spend-bearing actions reserve budget atomically in Redis before permit issuance so concurrent agent actions cannot jointly exceed available budget.
6. **Single-Use, Hash-Bound Permits (`P2`, `F09`)**: Execution permits are short-lived (60s TTL), bound to `tool_id`, `operation`, `parameters_hash`, `context_hash`, and `revocation_epoch`, and consumed atomically once.
7. **Untrusted External Content (`P7`, `F02`, `F12`)**: Vendor descriptions, web pages, and tool outputs are tagged as untrusted data and can never alter execution scope or policy rules.
8. **Zero Paid Credentials in CI (`NFR-010`)**: All unit, contract, policy, and CI tests must pass deterministically with `LLM_API_KEY=""` and `LLM_PROVIDER="mock"`.

---

## 3. Enterprise Community Feedback & Feature Review (`F01`–`F16`)

Based on practitioner feedback from enterprise FinOps deployments, OWASP Agentic Security guidelines, LangGraph/MCP production postmortems, and OPA policy engineering teams, the following synthesis governs how we build `F01`–`F16`:

### 3.1 What Practitioners Value & Prefer Most (Preserve & Emphasize)

- **Air-Gapped Planning vs. Execution (`F02`, `F03`, `F10`)**: Enterprise teams reject prompt-only guardrails for financial agents. Keeping credentials completely out of the agent worker and requiring a signed Execution Permit (`F09`) at the service adapter boundary is the highest-valued architectural property.
- **Two-Phase Transactional Budget Holds (`F06`)**: Treating agent budgets like credit card pre-authorizations (`pending -> reserved -> committed / released / reconciliation_required`) prevents parallel tool-calling TOCTOU overspend races (`006_budget_concurrency.yaml`).
- **Policy-as-Code with Unit Tests (`F05`)**: Platform and compliance teams strongly prefer OPA/Rego with automated unit tests (`policy/tests/neolith_test.rego`) over scattered imperative `if/else` checks.
- **Tamper-Evident Decision Receipts (`F13`)**: Compliance and internal audit teams value hash-chained receipts (`previous_receipt_hash -> receipt_hash`) that bind the exact policy digest, requester, agent version, and permit ID without introducing unnecessary blockchain complexity.

### 3.2 What Becomes an Unnecessary Hindrance (Pitfalls to Avoid)

1. **Approval Fatigue ("Rubber-Stamping") (`F07`, `F08`)**:
   - *Problem*: Routing low-value, compliant, within-budget actions to human approval causes approvers to blindly click "Approve" or abandons automation value.
   - *Neolith Rule*: Compliant actions below `approval_threshold` (e.g., `TaskForge` at `INR 6,000.00` under an `INR 8,000.00` budget and `INR 7,000.00` approval threshold) **auto-allow (`R2`)** via deterministic policy. Human approval (`review`, `R3`) is reserved for threshold breaches, medium-confidence alignment uncertainty, or untrusted taint escalation.
2. **Governance Latency Tax on Read-Only Discovery (`F02`, `F10`)**:
   - *Problem*: Requiring cryptographic permits and budget locks for read-only catalogue lookups makes agents sluggish.
   - *Neolith Rule*: Read-only MCP tools (`R0`/`R1`, e.g., vendor catalogue retrieval) execute under fast-path read allowlists without issuing single-use write permits or budget locks.
3. **Opaque "Black-Box" Denials Causing Agent Retry Loops (`F03`, `F05`)**:
   - *Problem*: Returning a bare `403 Forbidden` causes LLM agents to hallucinate parameter tweaks in a retry loop.
   - *Neolith Rule*: Every denial returns structured `reason_codes` (e.g., `BUDGET_EXCEEDED`, `POLICY_CATEGORY_DENIED`, `PERMISSION_MISSING`) and constraint context so the Primary Agent either revises the plan within remaining authority or halts and explains the exact reason to the user (`specs/prompts/primary_runtime_agent.md` Rules 7–8).
4. **Orphaned Budget Reservations During Long Human Approval Waits (`F06`, `F08`)**:
   - *Problem*: Holding a short-TTL Redis lock indefinitely while waiting hours for human approval starves concurrent tasks or causes premature lock expiry.
   - *Neolith Rule*: Every `budget_reservations` and `approvals` record carries an explicit `expires_at` timestamp, and expired reservations transition cleanly to `expired`/`released`.
5. **Raw JSON Dump in Approver UI (`F01`, `F08`)**:
   - *Problem*: Showing approvers a raw 60-line JSON payload leads to human oversight errors.
   - *Neolith Rule*: Use structured UI components (`DataTable`, `BudgetMeter`, `ReasonCodeList`, `StatusTimeline`, `CopyableId`) so approvers immediately see vendor, amount, budget impact, risk tier, and reason codes before approving.

---

## 4. Web & UI Engineering Standards (`apps/web`)

1. **Semantic HTML & Accessibility (WCAG 2.1 AA)**:
   - Every page must have a single `<h1>` (`className="page-title"`), logical `<h2>`/`<h3>` hierarchy, and landmark regions (`<header>`, `<nav>`, `<main>`).
   - Governance states (`allow`, `deny`, `review`) and risk tiers (`R0`–`R4`) must use icon + text (`DecisionBadge`, `RiskTierBadge`), never color alone.
2. **Reusable Component Library (`apps/web/src/components/ui`)**:
   - Use shared primitives (`Badge`, `Button`, `Card`, `DataTable`, `CopyableId`, `StatusTimeline`, `ReasonCodeList`, `BudgetMeter`, `EmptyState`, `ErrorBoundary`) rather than duplicating ad-hoc markup.
3. **No Fake Metrics or Unbacked Controls (`P11`)**:
   - Never display hardcoded latency numbers, fake charts, or buttons that pretend to mutate governance state without calling a real backend endpoint.

---

## 5. What We Need to Tackle Next (Roadmap Execution Order)

| Phase | Scope | Verification Gate |
|---|---|---|
| **Phase 0 (Done)** | Monorepo, FastAPI `/health` & `/ready`, Next.js shell, reusable UI library, full project skeleton, contract validator, CI. | `pytest`, `ruff`, `mypy`, `pnpm lint/typecheck/build`, `validate_contracts.py` all pass. |
| **Phase 1** | SQLAlchemy 2 ORM models + migrations for `specs/sql/schema.sql`, deterministic seed script, CRUD registries for `users`, `agents`, `tools`, `tasks`. | Inactive or unknown `agent_version` is deterministically rejected. |
| **Phase 2** | LangGraph Primary Agent (`services/agent-worker`), constraint extraction, grounded comparison against `data/fixtures/vendors.json`, structured plan & proposal. | Recommends `TaskForge` (`INR 6,000.00`) for 10-seat / `8,000 INR` goal without executing protected writes. |
| **Phase 3** | Permission Validator + live OPA evaluation (`POST /api/v1/actions/evaluate`), policy versioning, structured `reason_codes`. | `001_procurement_happy_path` allows; `002_over_budget` and `003_prompt_injection` deny. |
| **Phase 4** | Redis atomic budget reservation script, Ed25519 JWS permit issuance/verification (`F09`), and protected procurement simulator (`F10`). | `004_permit_replay`, `005_parameter_mutation`, and `006_budget_concurrency` pass with zero overspend. |
| **Phase 5** | Human approval workflow (`F08`), hash-bound approval verification, and SHA-256 hash-linked Decision Receipts (`F13`). | Tampered receipt fails `POST /api/v1/receipts/{id}/verify`. |
| **Phase 6** | Deterministic + semantic risk signals (`F07`), agent quarantine, and `revocation_epoch` emergency stop (`007_emergency_stop.yaml`). | Old permit fails immediately after emergency stop increments `revocation_epoch`. |
| **Phase 7 & 8** | End-to-end OpenTelemetry traces, Assurance Lab runner (`F15`), and full interactive demo UI wiring. | All 7 evaluation scenarios pass reproducibly from clean seed. |
