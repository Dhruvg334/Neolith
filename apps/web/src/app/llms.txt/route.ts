import { NextResponse } from "next/server";

export function GET() {
  const content = `# Neolith — AI-Powered Agentic Decision and Execution System

> Enterprise agentic AI platform separating intelligent planning from governed execution authority.

## Core Value Proposition
Neolith separates intelligent financial goal understanding, vendor evaluation, and action planning from deterministic execution authority. An AI agent can freely read bank balances, compare invoices, and formulate action proposals, but holds zero direct authority to disburse funds. Real-world execution requires independent, deterministic authority verified by compiled Open Policy Agent (OPA Rego) rules, category budget locks, human approval checkpoints, and short-lived single-use Execution Permits.

## The Three Architectural Layers
1. **AI Agent Layer (Reasoning & Planning, Tier R1)**: Evaluates user intent, inspects invoices, audits category spend against budgets, and prepares structured FinancialActionProposal envelopes. Operates with zero ambient authority.
2. **Governance & Execution Control Layer (The Gateway, Tier R3)**: Deterministic policy boundary running Open Policy Agent (OPA Rego v1). Evaluates cryptographic agent manifests, capability bindings, category budget ceilings, vendor verification flags, and active governance profile thresholds.
3. **Enterprise Services & Audit Layer (Operational Vault, Tier R2)**: Executes ledger disbursements and transfers strictly upon presentation of a valid 60-second single-use Execution Permit, permanently appending tamper-evident cryptographic decision receipts to an immutable hash chain.

## Core Non-Negotiable Invariants
1. **Zero Implicit Authority**: No autonomous execution of protected tools without a short-lived single-use Execution Permit (F09).
2. **Authoritative OPA Policy Engine**: Policy decisions are fail-closed; if OPA is unavailable, decisions default to DENY with OPA_SERVICE_UNAVAILABLE (F05).
3. **Parameter Hash Binding**: Canonical SHA-256 digest of parameters is verified before settlement; tampering triggers PARAMETER_HASH_MISMATCH (F09).
4. **Monotonic Revocation Epoch**: Cluster emergency kill-switch increments the revocation epoch, instantly invalidating all outstanding permits (UC8, F09).
5. **Tamper-Evident Receipts Ledger**: Append-only cryptographic hash chain permanently records all decisions, permits, and settlements (F13).

## Key Web Routes
- \`/\` — Enterprise Landing Page, architectural comparison, and 4-step lifecycle
- \`/agent\` — Multi-channel conversational financial assistant console with visual governance boundaries
- \`/approvals\` — Human-in-the-loop operational review queue for actions exceeding thresholds
- \`/dashboard\` — Treasury overview, operating accounts, budget utilization meters, recent transactions
- \`/accounts\` — Accounts, vendor invoices (INV-001, INV-002, INV-003), beneficiaries, and audit ledger
- \`/governance\` — Policy engine telemetry, outcome distributions, active profile inspection
- \`/policies\` — Policy profile manager (Strict, Balanced, High Autonomy) and custom threshold builder
- \`/operator\` — Operator control plane, cluster emergency kill-switch, agent quarantine, and F15 Assurance Lab
- \`/receipts/[id]\` — Tamper-evident decision receipt visualizer with cryptographic hash chain verification
- \`/docs\` — Interactive Documentation Hub with 10 zoomable Mermaid architecture diagrams
- \`/adopt\` — 10-step enterprise organization adoption guide
- \`/security\` — Security architecture, threat model, and invariant specifications
- \`/privacy\`, \`/terms\` — Production trust, privacy, and legal compliance pages

## Canonical Scenarios & Deterministic Outcomes
- **INV-001 (Acme Cloud, INR 8,000.00)**: Evaluates to **ALLOW** (\`BASE_POLICY_ALLOW\`). Routine cloud subscription within software budget; auto-mints 60s permit and settles payment.
- **INV-002 (Nova Compute, INR 35,000.00)**: Evaluates to **REVIEW** (\`APPROVAL_REQUIRED\`). High-value infrastructure exceeding INR 25,000 threshold; enqueues in \`/approvals\` for human manager sign-off.
- **INV-003 (Unknown Supplies, INR 75,000.00)**: Evaluates to **DENY** (\`BUDGET_EXCEEDED\`, \`UNVERIFIED_BENEFICIARY\`). Dual violation: unverified beneficiary directory match and category spend cap breach.

## Primary API Endpoints
- \`POST /api/v1/interactions/message\` — Natural language operator turn ingestion across web, WhatsApp, and voice
- \`POST /api/v1/actions/evaluate\` — Authoritative governance evaluation of proposed financial actions
- \`GET /api/v1/approvals\` — Retrieve human review checkpoints filtered by state (pending, approved, rejected)
- \`POST /api/v1/approvals/{id}/approve\` — Human manager approval shortcut triggering permitted settlement
- \`POST /api/v1/permits/{id}/consume\` — Single-use permit consumption with anti-tampering verification
- \`GET /api/v1/system/state\` — Cluster emergency stop state and active revocation epoch
- \`POST /api/v1/system/emergency-stop\` — Trigger immediate cluster-wide kill-switch and permit revocation
- \`POST /api/v1/agents/{id}/quarantine\` — Quarantine an agent identity, causing immediate AGENT_INACTIVE denials
- \`GET /api/v1/receipts/verify\` — Cryptographic traversal and verification of the decision receipts ledger
- \`POST /api/v1/evaluation/runs\` — Execute the F15 Security & Policy Assurance Lab (7 canonical scenarios)
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
