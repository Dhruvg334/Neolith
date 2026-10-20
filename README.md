<div align="center">

# Neolith

### AI-Powered Agentic Decision and Execution System

**A Smart Governance Checkpoint Separating AI Agent Planning from Real-World Financial & Enterprise Execution**

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-0f172a?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Open Policy Agent](https://img.shields.io/badge/OPA-Rego_v1-7d9199?style=flat-square&logo=openpolicyagent&logoColor=white)](https://www.openpolicyagent.org/)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-dc382d?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)

</div>

---

<h2 align="center">What is Neolith? (In Plain English)</h2>

Imagine hiring an **AI assistant** to help run your company's finance department. You want the AI to read invoices, check bank balances, compare software vendors, and prepare payments.

In most AI systems today, giving an AI the ability to pay an invoice means handing it the company credit card or direct banking API keys. **That is dangerous:**
- What if a fake invoice tricks the AI (**prompt injection**)?
- What if the AI hallucinates an extra zero and tries to pay **INR 80,000** instead of **INR 8,000**?
- What if two AI tasks run at the same time and accidentally spend more than the monthly budget?

**Neolith solves this by separating *thinking* from *doing*.**

Instead of giving the AI direct authority to move money or modify company systems, Neolith places a deterministic **Governance & Execution Control Plane** between the AI and the bank:

1. **The AI Agent Layer (The Planner)** — The AI can freely **read** balances, invoices, and budgets, and it can **propose** an action (for example: *"I recommend paying Invoice INV-001 for INR 8,000.00"*). However, the AI has **zero direct power** to execute that payment.
2. **The Governance Control Layer (The Security Checkpoint)** — Neolith's Runtime Gateway inspects the AI's proposal against strict deterministic rules (Open Policy Agent), locks the required budget in Redis so it cannot be double-spent, checks whether a human manager needs to approve it, and—only if every check passes—mints a **60-second, single-use digital pass (Ed25519 Execution Permit)**.
3. **The Enterprise Services Layer (The Vault)** — The banking or procurement system refuses to talk to the AI directly unless the AI presents that cryptographic single-use permit matching the exact payment amount and recipient. Every decision is permanently recorded in a tamper-evident **Decision Receipt chain**.

> **Core Principle:** *AI agents may understand, research, compare, and propose. Real-world execution requires independent, deterministic authority.*

---

<h2 align="center">System Architecture (HLD & LLD)</h2>

<h3 align="center">1. High-Level Design (HLD) — Three-Layer Governance Topology</h3>

The **High-Level Design (HLD)** illustrates how user intent flows through the **AI Agent Layer**, is independently verified by the **Governance & Execution Control Layer**, and is executed by **Protected Enterprise Services**.

```mermaid
flowchart TB
    U["User / Treasury Operator"]

    subgraph A["HLD Layer 1: AI Agent Layer (Planning & Research Only)"]
        A1["Goal & Constraint Understanding"]
        A2["Read-Only Context Lookup<br/>(Balances, Invoices, Budgets)"]
        A3["Candidate Comparison & Reasoning"]
        A4["Structured Action Proposal<br/>(Zero Implicit Authority)"]
    end

    subgraph G["HLD Layer 2: Governance & Execution Control Layer (Neolith Runtime Gateway)"]
        G1["Runtime Gateway & Canonical Action Envelope"]
        G2["Identity & Role Permission Check"]
        G3["Deterministic Policy Engine (OPA / Rego)"]
        G4["Atomic Budget Reservation (Redis + PostgreSQL)"]
        G5["Risk Tiering & Human-in-the-Loop Approval"]
        G6["60s Single-Use Ed25519 Permit Signer"]
        G7["Tamper-Evident Decision Receipt Ledger"]
    end

    subgraph E["HLD Layer 3: Enterprise Services Layer (Permit-Gated Execution)"]
        E1["Financial Reference Sandbox<br/>(Invoice Payment & Treasury Transfer)"]
        E2["Procurement Subscription Service"]
    end

    U -->|"Natural-Language Task"| A1
    A1 --> A2 --> A3 --> A4
    A4 -->|"Proposed Action Envelope"| G1
    G1 --> G2 --> G3 --> G4 --> G5 --> G6
    G6 -->|"Signed Single-Use Permit (JWS)"| E1
    G6 -->|"Signed Single-Use Permit (JWS)"| E2
    G1 --> G7
    E1 -->|"Verified Settlement Receipt"| G7
```

---

<h3 align="center">2. Low-Level Design (LLD) — Service, Database & Protocol Component Topology</h3>

The **Low-Level Design (LLD)** shows the concrete runtime services, API routers, SQLAlchemy 2.0 / PostgreSQL tables, Redis atomic locks, and cryptographic verification boundaries inside the monorepo.

```mermaid
flowchart LR
    subgraph Web["LLD: Next.js 15 Web UI (apps/web)"]
        UI_Dash["/dashboard & /accounts"]
        UI_Agent["/agent & /tasks"]
        UI_Op["/operator & /approvals"]
    end

    subgraph API["LLD: FastAPI Control Plane (services/api)"]
        R_Fin["Financial Router<br/>(/api/v1/financial/*)"]
        R_Reg["Registry & Task Router<br/>(/api/v1/tasks, /agents, /tools, /budgets)"]
        R_Gov["Runtime Gateway & Permit Verifier<br/>(/api/v1/actions/*, /permits/*)"]
        Hash["RFC 8785 Canonical JSON + SHA-256"]
    end

    subgraph Worker["LLD: Agent Worker (services/agent-worker)"]
        LG["LangGraph State Machine<br/>(AgentWorkflowState)"]
        FC["FinancialContext &<br/>FinancialActionProposal"]
        LLM["LLM Provider Adapter<br/>(OpenAI / Deterministic Mock)"]
    end

    subgraph Sim["LLD: Protected Simulator (services/tool-simulator)"]
        BankR["SimulatedBankingService<br/>Read Tools (R1)"]
        BankW["SimulatedBankingService<br/>Permit-Gated Write Tools (R2-R4)"]
    end

    subgraph Infra["LLD: Storage & Policy Infrastructure"]
        PG[("PostgreSQL 17 / SQLAlchemy 2.0<br/>users, agents, tools, tasks, budgets,<br/>financial_accounts, financial_invoices,<br/>financial_beneficiaries, financial_transactions")]
        Redis[("Redis 7<br/>Budget Locks, Nonces,<br/>Revocation Epoch")]
        OPA["Open Policy Agent<br/>(package neolith.decision)"]
        OTel["OpenTelemetry + Jaeger<br/>(X-Trace-Id Correlation)"]
    end

    UI_Dash --> R_Fin
    UI_Agent --> R_Reg
    UI_Op --> R_Reg
    LG --> FC --> LLM
    LG --> BankR
    LG --> R_Gov
    R_Fin --> PG
    R_Reg --> PG
    R_Gov --> Hash
    R_Gov --> OPA
    R_Gov --> Redis
    R_Gov --> PG
    R_Gov --> BankW
    API --> OTel
```

---

<h3 align="center">3. Low-Level Design (LLD) — Governed Financial Execution Sequence</h3>

```mermaid
sequenceDiagram
    autonumber
    actor User as Treasury User
    participant Agent as Financial AI Agent (LangGraph)
    participant Gateway as Runtime Gateway (FastAPI)
    participant OPA as OPA Policy Engine (Rego)
    participant Redis as Redis Budget & Nonce Store
    participant Approver as Human Approver
    participant Bank as SimulatedBankingService
    participant Ledger as PostgreSQL Ledger & Receipts

    User->>Agent: "Pay invoice INV-001 for Acme Cloud"
    Agent->>Gateway: GET /api/v1/financial/invoices/INV-001 & /financial/budgets (R1 Read)
    Agent->>Gateway: Submit FinancialActionProposal (pay_invoice, INR 8000.00, software)
    Gateway->>Ledger: Record ExecutionRequest & append receipt (action_received)
    Gateway->>OPA: Evaluate permissions, vendor verification, and category budget
    OPA-->>Gateway: Decision (ALLOW | REVIEW | DENY) + structured reason_codes
    alt Decision == REVIEW (e.g., INV-002 INR 35,000.00 exceeds approval threshold)
        Gateway->>Approver: Queue approval bound to canonical parameters_hash
        Approver->>Gateway: Approve exact parameters_hash
    end
    Gateway->>Redis: Atomically reserve INR 8,000.00 from software budget
    Gateway->>Gateway: Mint 60s Ed25519 Execution Permit (bound to nonce & epoch)
    Gateway->>Bank: Invoke pay_invoice with signed Execution Permit
    Bank->>Gateway: Verify & consume single-use permit nonce
    Bank->>Ledger: Mark INV-001 paid, debit Operations Account, append DecisionReceipt
    Gateway-->>User: Settlement confirmed + cryptographic receipt chain
```

---

<h2 align="center">Use Case Diagram</h2>

```mermaid
flowchart LR
    subgraph Actors["Enterprise Actors"]
        Req["Treasury Requester"]
        App["Finance Approver"]
        Op["Platform Operator"]
        Aud["Compliance Auditor"]
        Ag["Financial AI Agent"]
    end

    subgraph UseCases["Neolith Platform Use Cases"]
        UC1(["Inspect Account Balances, Invoices & Category Budgets"])
        UC2(["Submit Natural-Language Financial or Procurement Task"])
        UC3(["Read FinancialContext & Propose Candidate Action"])
        UC4(["Evaluate Capabilities, OPA Policy & Vendor Verification"])
        UC5(["Reserve Category Budget & Mint Ed25519 Execution Permit"])
        UC6(["Approve or Reject High-Value Invoice Payment"])
        UC7(["Audit Registered Agents, Tools, Risk Tiers & Schemas"])
        UC8(["Quarantine Agent or Trigger Global Emergency Stop"])
        UC9(["Verify SHA-256 Hash-Linked Decision Receipt Chain"])
    end

    Req --> UC1
    Req --> UC2
    Ag --> UC1
    Ag --> UC3
    UC3 --> UC4
    UC4 --> UC5
    App --> UC6
    UC6 --> UC5
    Op --> UC7
    Op --> UC8
    Aud --> UC9
```

---

<h2 align="center">Financial Reference Application (Neolith Demo Corp)</h2>

While Neolith's governance control plane is general-purpose, the repository includes a complete **Financial Reference Application** (`services/api/src/neolith_api/financial/` and `services/tool-simulator/src/neolith_simulator/banking.py`) pre-seeded with deterministic enterprise treasury data for **Neolith Demo Corp**:

- **Primary Operating Account**: `Operations Account` — Available Balance: **`INR 100,000.00`** (`active`)
- **Monthly Category Budgets**:
  - `software`: **`INR 25,000.00`** limit (`INR 15,000.00` approval threshold)
  - `infrastructure`: **`INR 50,000.00`** limit (`INR 25,000.00` approval threshold)
  - `miscellaneous`: **`INR 10,000.00`** limit (`INR 5,000.00` approval threshold)

### Benchmark Invoices & Governance Outcomes

| Invoice # | Vendor Name | Amount (`INR`) | Category | Vendor Status | Expected Governance Outcome |
|:---:|---|---:|:---:|:---:|---|
| **`INV-001`** | **Acme Cloud** | `8,000.00` | `software` | `Verified` | **`ALLOW`** — Verified vendor and well within the `INR 25,000.00` software budget. |
| **`INV-002`** | **Nova Compute** | `35,000.00` | `infrastructure` | `Verified` | **`REVIEW`** — Within the `INR 50,000.00` infrastructure budget, but exceeds the `INR 25,000.00` single-payment approval threshold. |
| **`INV-003`** | **Unknown Supplies** | `75,000.00` | `miscellaneous` | `Unverified` | **`DENY`** — Blocked because the vendor is unverified and `INR 75,000.00` exceeds the `INR 10,000.00` miscellaneous budget. |

### Registered Financial Agent Tools (`financial-ai-agent`)

| Tool Name | Access Mode | Risk Tier | Capability | Description |
|---|:---:|:---:|---|---|
| `get_account_balance` | **Read-Only** | `R1` | `finance.account.read` | Inspect synthetic operating account balance (`INR`). |
| `list_transactions` | **Read-Only** | `R1` | `finance.transaction.read` | List recent treasury ledger transactions. |
| `get_invoice` | **Read-Only** | `R1` | `finance.invoice.read` | Retrieve vendor invoice details (`INV-001`, `INV-002`, `INV-003`). |
| `get_budget_status` | **Read-Only** | `R1` | `finance.budget.read` | Check monthly category budget limits, used spend, and remaining balance. |
| `get_beneficiary` | **Read-Only** | `R1` | `finance.beneficiary.read` | Check whether a vendor beneficiary is verified. |
| `pay_invoice` | **Protected Write** | `R2` | `finance.invoice.pay` | Settle an unpaid vendor invoice (**requires Runtime Gateway permit**). |
| `transfer_funds` | **Protected Write** | `R3` | `finance.funds.transfer` | Transfer funds to a registered beneficiary (**requires Runtime Gateway permit**). |
| `add_beneficiary` | **Protected Write** | `R4` | `finance.beneficiary.manage` | Register a new payment beneficiary (**requires Runtime Gateway permit**). |
| `cancel_payment` | **Protected Write** | `R2` | `finance.payment.cancel` | Cancel or compensate a pending payment (**requires Runtime Gateway permit**). |

---

<h2 align="center">Core Platform Features (F01–F16)</h2>

| ID | Feature Module | Description |
|:---:|---|---|
| **F01** | **User Task Workspace** | Structured workspace (`/tasks`, `/agent`) for goal submission, grounded context inspection, and status tracking. |
| **F02** | **Primary Agent Planning & Research** | Stateful LangGraph workflow that reads `FinancialContext` and emits typed `FinancialActionProposal` envelopes. |
| **F03** | **Runtime Gateway & Action Envelope** | Single mandatory entry point normalizing requests into RFC 8785 canonical JSON envelopes with idempotency enforcement. |
| **F04** | **Identity & Permission Validation** | Separates principal authentication, workload version verification, and RBAC/ABAC capability bindings from policy. |
| **F05** | **Deterministic Policy Engine** | Versioned Open Policy Agent (Rego v1) bundles producing structured `reason_codes` and required approval roles. |
| **F06** | **Transactional Budget & Quota Manager** | Authoritative category and task budgets using exact `Decimal` (`Numeric(18, 2)`) arithmetic and atomic reservations. |
| **F07** | **Multi-Signal Risk Analyzer** | Combines deterministic risk tiering (`R0`–`R4`) with semantic alignment signals that can escalate review but never override a hard deny. |
| **F08** | **Human Approval Workflow** | Durable workflow pause/resume where human sign-off is cryptographically bound to the exact canonical action hash. |
| **F09** | **Execution Permit Service** | Issues 60-second Ed25519-signed JWS permits bound to `tool_id`, `operation`, `parameters_hash`, `reservation_id`, and `revocation_epoch`. |
| **F10** | **Enterprise Service & MCP Connectors** | Read-only context tools paired with permit-enforcing protected service adapters (`SimulatedBankingService`). |
| **F11** | **Scoped Delegation & Multi-Agent** | Authority-narrowing delegation boundaries with maximum depth and budget ceiling enforcement. |
| **F12** | **Memory & Governed RAG** | Separates working task state, authoritative PostgreSQL records, and non-authoritative retrieval with untrusted content tagging. |
| **F13** | **Decision Receipts & Incidents** | Append-only SHA-256 hash-linked evidence chain (`previous_receipt_hash -> receipt_hash`) and incident timelines. |
| **F14** | **OpenTelemetry Observability** | End-to-end `X-Trace-Id` propagation, structured JSON logging, and Jaeger distributed tracing. |
| **F15** | **Evaluation & Assurance Lab** | Reproducible scenario harness testing happy paths, over-budget denials, prompt injection, permit replay, and emergency stops. |
| **F16** | **Financial & Procurement Reference Workflows** | Deterministic enterprise financial sandbox (`Neolith Demo Corp`) and procurement catalogue slice. |

---

<h2 align="center">Repository Structure</h2>

```text
Neolith/
├── apps/
│   └── web/                        # Next.js 15 App Router frontend + reusable enterprise UI library
│       └── src/
│           ├── app/                # Routes: /, /dashboard, /accounts, /agent, /tasks, /approvals, /operator
│           ├── components/         # AppShell, AgentTaskConsole & reusable UI primitives (Card, DataTable, BudgetMeter)
│           └── lib/                # Typed Financial & Platform API client with offline seed snapshot fallback
├── services/
│   ├── api/                        # FastAPI control plane, SQLAlchemy 2.0 ORM, Alembic migrations & seed module
│   │   ├── migrations/             # Alembic migration environment & Stage 1 initial revision
│   │   ├── src/neolith_api/        # Core ORM models, isolated financial sandbox, read/registry routers
│   │   └── tests/                  # Comprehensive pytest suite (health, readiness, financial sandbox, migrations)
│   ├── agent-worker/               # LangGraph agent state machine, FinancialContext & FinancialActionProposal contracts
│   └── tool-simulator/             # SimulatedBankingService (R1 read tools + permit-gated R2-R4 write stubs)
├── packages/
│   └── contracts/                  # Shared TypeScript contract interfaces & schema identifiers
├── policy/
│   ├── rego/neolith.rego           # Deterministic OPA Rego v1 decision policy
│   └── tests/neolith_test.rego     # Rego unit tests
├── specs/
│   ├── openapi.yaml                # OpenAPI 3.1.0 REST specification
│   ├── schemas/                    # JSON Schema Draft 2020-12 contracts
│   ├── sql/schema.sql              # Authoritative PostgreSQL 17 DDL schema
│   └── prompts/                    # Versioned runtime system prompts
├── evaluation/
│   └── scenarios/                  # 7 deterministic YAML assurance & adversarial test fixtures
├── infra/
│   └── docker-compose.yml          # Local PostgreSQL 17, Redis 7, OPA & Jaeger stack
├── scripts/
│   ├── check_docs.py               # Documentation & schema presence verifier
│   └── validate_contracts.py       # Comprehensive OpenAPI, JSON Schema, SQL & YAML validator
└── docs/                           # SRS, architecture, feature specs (F01-F16), Financial Reference App docs & rulebook
```

---

<h2 align="center">Self-Setup & Local Development Guide</h2>

### 1. Prerequisites

- **Python**: `3.12+`
- **Node.js**: `22.0+` with `pnpm` (`corepack enable pnpm`)
- **Docker Desktop**: Optional for local SQLite development; required for full PostgreSQL 17, Redis 7, Open Policy Agent, and Jaeger container stack
- **Git**: `2.40+`

### 2. Clone & Configure Environment

```cmd
git clone https://github.com/Dhruvg334/Neolith.git
cd Neolith
if not exist .secrets mkdir .secrets
if not exist .env copy .env.example .env
```

### 3. Start Local Infrastructure (PostgreSQL, Redis, OPA, Jaeger)

```cmd
docker compose -f infra\docker-compose.yml up -d
docker compose -f infra\docker-compose.yml ps
```

### 4. Backend Setup, Database Migration & Deterministic Seed (`services/api`)

```cmd
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

Run Alembic migrations and seed the deterministic Financial Reference Application dataset (`Neolith Demo Corp`):

```cmd
cd services\api
..\..\.venv\Scripts\python.exe -m alembic upgrade head
cd ..\..
.venv\Scripts\python.exe -m neolith_api.seed
```

Start the FastAPI server on `http://localhost:8000`:

```cmd
.venv\Scripts\python.exe -m uvicorn neolith_api.main:app --app-dir services\api\src --host 0.0.0.0 --port 8000 --reload
```

Verify the health, readiness, and financial sandbox endpoints:

```cmd
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/financial/summary
curl http://localhost:8000/api/v1/financial/invoices
curl http://localhost:8000/api/v1/financial/budgets
curl http://localhost:8000/api/v1/financial/tools
```

### 5. Frontend Setup & Verification (`apps/web`)

```cmd
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000` in your browser to explore:
- `/` — System Overview & Three-Layer Governance Architecture
- `/dashboard` — Financial Dashboard (`INR 100,000.00` balance, unpaid invoices, monthly category budgets, recent transactions)
- `/accounts` — Accounts, Vendor Invoices (`INV-001`, `INV-002`, `INV-003`), Beneficiaries & Ledger
- `/agent` — Financial Agent Console (`financial-ai-agent`), `FinancialContext` inspector & tool permissions
- `/tasks` — Persisted Task Registry & Goal Intake
- `/operator` — Operator Control Plane (Registered Agents, `R1`–`R4` Tool Classifications, Budgets & Reason Codes)

### 6. Run Quality Gates, Contract Validators & Automated Tests

```cmd
:: Validate OpenAPI 3.1.0, JSON Schemas, SQL DDL, and Evaluation YAML fixtures
.venv\Scripts\python.exe scripts\check_docs.py
.venv\Scripts\python.exe scripts\validate_contracts.py

:: Run Python linter, formatter check, strict typecheck, and pytest suite
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m ruff format --check .
.venv\Scripts\python.exe -m mypy
.venv\Scripts\python.exe -m pytest -v

:: Run Frontend ESLint, TypeScript typecheck, and production build
pnpm lint
pnpm typecheck
pnpm build
```

---

<h2 align="center">Project Team & Academic Supervision</h2>

<div align="center">

Built as **Major Project - I** at **Kalinga Institute of Industrial Technology (KIIT University)**.

| Role | Name |
|---|---|
| **Project Guide & Supervisor** | **Prof. N Sangita Achary** |
| **Team Member** | **Dhruv Gupta** |
| **Team Member** | **Akkshita Isa** |
| **Team Member** | **Akshhaya Isa** |
| **Team Member** | **Shubhangini Mehta** |

</div>
