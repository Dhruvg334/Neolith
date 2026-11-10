import { NextResponse } from "next/server";

export function GET() {
  const content = `# Neolith — Agentic Decision and Execution System

> Enterprise agentic AI platform separating intelligent planning from governed execution authority.

## Core Architecture (12 Layers)
- Layer 1: Multi-Channel Interface (Web App Router, Twilio WhatsApp, Twilio Voice / ElevenLabs)
- Layer 2: Agent Orchestration (LangGraph multi-step planning and task lifecycle)
- Layer 3: Deterministic Domain Core (Financial Reference Application with double-entry ledger)
- Layer 4: Context & Memory (Session state and turn tracking across channels)
- Layer 5: Data Foundation (PostgreSQL / SQLite with SQLAlchemy 2.0 and Alembic)
- Layer 6: Tool Integration (Protected tool simulator, MCP interfaces, REST endpoints)
- Layer 7: Human Checkpoints (F08 Human Approvals queue for proposals exceeding limits)
- Layer 8: LLM Routing (Dynamic routing with deterministic fallback)
- Layer 9: Testing & Evaluation (Pytest test suites, OPA policy tests, evaluation harness)
- Layer 10: Security & Access Control (Open Policy Agent v1.22.2, Execution Permits, Nonces)
- Layer 11: Observability & Telemetry (OpenTelemetry distributed tracing, X-Trace-Id)
- Layer 12: Continuous Improvement (Hash-linked decision receipts, regression suites)

## Core Non-Negotiable Invariants
1. No autonomous execution of protected tools without single-use Execution Permit (F09).
2. Authoritative OPA policy decision engine (Fail-Closed).
3. Parameter and context hash binding (SHA-256).
4. Monotonic revocation epoch and instant cluster kill-switch.
5. Append-only, tamper-evident Decision Receipts (F13).

## Key URLs & Documentation
- /agent: Multi-channel conversational financial assistant
- /dashboard: Treasury overview, operating accounts, budget utilization
- /approvals: Human-in-the-loop operational review queue
- /governance: Policy engine inspector, invariants, evaluation traces
- /policies: Policy bundle manager, style profiles (Strict, Balanced, High Autonomy)
- /operator: Operator controls, emergency stop, revocation
- /docs: Full technical architecture documentation hub
- /adopt: Organization adoption guide
- /security: Security architecture and invariant specification
- /sitemap.xml: Complete site index
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
