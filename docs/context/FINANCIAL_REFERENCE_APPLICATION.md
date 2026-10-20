# Financial Reference Application (`Neolith Demo Corp`)

## 1. Why the Financial Reference Application Exists

**Neolith** is a general-purpose **AI-Powered Agentic Decision and Execution System** whose core control plane (`Runtime Gateway`, `OPA Policy Engine`, `Transactional Budget Service`, `Execution Permit Service`, and `Decision Receipt Ledger`) is domain-agnostic.

To demonstrate and validate Neolith's governance guarantees with concrete, high-stakes enterprise actions, Neolith ships with an isolated **Financial Reference Application** (`services/api/src/neolith_api/financial/` and `services/tool-simulator/src/neolith_simulator/banking.py`).

Financial and accounts-payable workflows are the ideal reference domain for agentic governance because:
- Every monetary side-effect requires **exact `Decimal` precision** (`Numeric(18, 2)`), never floating-point approximation.
- Read-only telemetry (`get_account_balance`, `get_invoice`) is safe for autonomous AI exploration, whereas mutating actions (`pay_invoice`, `transfer_funds`, `add_beneficiary`, `cancel_payment`) carry material financial risk (`R2`–`R4`).
- Multi-dimensional policy rules—such as **monthly category budget caps**, **single-payment approval thresholds**, and **vendor verification requirements**—naturally exercise `ALLOW`, `REVIEW` (Human-in-the-Loop), and `DENY` outcomes.

---

## 2. Mapping to Neolith's Three-Layer Architecture

| Neolith Layer | Core Platform Responsibility | Financial Reference Application Role |
| :--- | :--- | :--- |
| **1. AI Agent Layer** (`services/agent-worker`) | Goal intake, context retrieval, grounded comparison, structured proposal generation. | `financial-ai-agent` inspects `FinancialContext` (account balance, category budgets, unpaid invoices) and emits a typed `FinancialActionProposal`. |
| **2. Governance & Execution Control Layer** (`services/api`) | Identity, RBAC/ABAC capability check, OPA/Rego policy evaluation, atomic Redis budget reservation, risk tiering, human approval, Ed25519 JWS permit issuance, hash-linked decision receipts. | Evaluates whether a proposed invoice payment or transfer is within the category budget, whether the vendor is verified, and whether human treasury sign-off is required before issuing a single-use `ExecutionPermit`. |
| **3. Enterprise Services Layer** (`services/tool-simulator`) | Protected business execution gated by cryptographic permit verification. | `SimulatedBankingService` executes `pay_invoice`, `transfer_funds`, `add_beneficiary`, and `cancel_payment` **only** when presented with a valid, unrevoked Runtime Gateway permit. |

> **Architectural Invariant**: The Financial Reference Application never embeds governance logic inside the financial domain or agent worker. All authorization, policy, budget, approval, permit, and receipt enforcement remain in Neolith's core control plane.

---

## 3. Read-Only Tools vs. Protected Write Tools

All 9 tools exposed to `financial-ai-agent` are registered in the `tools` and `tool_versions` tables with pinned SHA-256 schema hashes:

### 3.1 Read-Only Tools (`R1` — Safe for Agent Planning)
| Tool Name | Risk Tier | Capability | Purpose |
| :--- | :---: | :--- | :--- |
| `get_account_balance` | `R1` | `finance.account.read` | Inspect `Operations Account` available balance (`INR`). |
| `list_transactions` | `R1` | `finance.transaction.read` | Inspect recent ledger transactions. |
| `get_invoice` | `R1` | `finance.invoice.read` | Retrieve vendor invoice details by `invoice_number` (`INV-001`, etc.) or UUID. |
| `get_budget_status` | `R1` | `finance.budget.read` | Inspect monthly category budget limits, used amounts, and available balances. |
| `get_beneficiary` | `R1` | `finance.beneficiary.read` | Check whether a payment beneficiary is verified (`verified=True`). |

### 3.2 Protected Write Tools (`R2`–`R4` — Strictly Permit-Gated)
| Tool Name | Risk Tier | Reversibility | Capability | Purpose |
| :--- | :---: | :--- | :--- | :--- |
| `pay_invoice` | `R2` | `compensatable` | `finance.invoice.pay` | Settle an unpaid vendor invoice from `Operations Account`. |
| `transfer_funds` | `R3` | `irreversible` | `finance.funds.transfer` | Execute a direct treasury transfer to a beneficiary. |
| `add_beneficiary` | `R4` | `reversible` | `finance.beneficiary.manage` | Register a new external payment beneficiary. |
| `cancel_payment` | `R2` | `reversible` | `finance.payment.cancel` | Cancel or compensate a pending payment transaction. |

---

## 4. Deterministic Demo Dataset (`Neolith Demo Corp`)

The seed module (`services/api/src/neolith_api/seed.py`) populates a deterministic, idempotent baseline dataset:

### 4.1 Primary Account
- **Organisation**: `Neolith Demo Corp`
- **Account Name**: `Operations Account`
- **Currency**: `INR`
- **Available Balance**: `100000.00`
- **Status**: `active`

### 4.2 Monthly Category Budgets
| Category | Monthly Limit (`INR`) | Approval Threshold (`INR`) | Initial Used (`INR`) | Initial Available (`INR`) |
| :--- | ---: | ---: | ---: | ---: |
| `software` | `25000.00` | `15000.00` | `0.00` | `25000.00` |
| `infrastructure` | `50000.00` | `25000.00` | `0.00` | `50000.00` |
| `miscellaneous` | `10000.00` | `50000.00` / `5000.00` | `0.00` | `10000.00` |

### 4.3 Synthetic Vendor Invoices & Expected Governance Outcomes
| Invoice ID | Vendor | Amount (`INR`) | Category | Vendor Status | Invoice Status | Expected Runtime Gateway Outcome (Stage 2) |
| :--- | :--- | ---: | :--- | :--- | :--- | :--- |
| `INV-001` | `Acme Cloud` | `8000.00` | `software` | `verified` | `unpaid` | **`ALLOW`** — Verified vendor, within `25000.00 INR` software budget and below `15000.00 INR` approval threshold. |
| `INV-002` | `Nova Compute` | `35000.00` | `infrastructure` | `verified` | `unpaid` | **`REVIEW`** — Verified vendor and within `50000.00 INR` infrastructure budget, but exceeds the `25000.00 INR` single-payment approval threshold. |
| `INV-003` | `Unknown Supplies` | `75000.00` | `miscellaneous` | `unverified` | `unpaid` | **`DENY`** — Unverified beneficiary (`UNVERIFIED_BENEFICIARY`) and exceeds the `10000.00 INR` miscellaneous category budget (`BUDGET_EXCEEDED`). |

---

## 5. Why the AI Agent Cannot Directly Execute Payments

1. **No Public Unprotected Write Endpoints**: The FastAPI control plane exposes read-only inspection routes (`/api/v1/financial/accounts`, `/invoices`, `/beneficiaries`, `/transactions`, `/budgets`, `/summary`, `/tools`) and task intake (`POST /api/v1/tasks`), but **never** exposes an ungoverned `POST /pay` endpoint.
2. **Contract Separation**: `FinancialActionProposal` (`services/agent-worker/src/neolith_agent/state.py`) uses `ConfigDict(extra="forbid")` and explicitly excludes governance decision fields (`permission_granted`, `policy_allowed`, `permit_valid`, `approved`).
3. **Simulator Permit Gate**: Calling `pay_invoice`, `transfer_funds`, `add_beneficiary`, or `cancel_payment` on `SimulatedBankingService` without a verified Runtime Gateway `ExecutionPermit` immediately raises `PermitRequiredError`.

---

## 6. How Stage 2 Connects Governance and Execution Permits

In Stage 2, when `financial-ai-agent` emits a `FinancialActionProposal`:
1. The proposal is wrapped into a canonical `ExecutionRequest` action envelope and submitted to `POST /api/v1/actions/evaluate`.
2. The Runtime Gateway evaluates RBAC/ABAC permissions, OPA/Rego policies (`policies/neolith/`), and atomic Redis budget reservations.
3. For `ALLOW` decisions (or after human approval on `REVIEW` decisions), the Runtime Gateway signs a short-lived Ed25519 `ExecutionPermit` bound to the canonical `parameters_hash` and current `revocation_epoch`.
4. `SimulatedBankingService` verifies and consumes the single-use permit, settles the invoice in PostgreSQL, commits the budget reservation, and appends a hash-linked `DecisionReceipt`.
