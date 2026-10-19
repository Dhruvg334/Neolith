import Link from "next/link";
import { CONTRACT_SCHEMA_IDS } from "@neolith/contracts";
import {
  Badge,
  Card,
  CardHeader,
  CopyableId,
  ErrorBoundary,
  RiskTierBadge,
  StatusTimeline,
  type TimelineStep,
} from "@/components/ui";

const ARCHITECTURE_FLOW_STEPS: readonly TimelineStep[] = [
  {
    id: "step-intent",
    title: "1. Goal Understanding, Retrieval & Grounded Comparison",
    description:
      "Primary Agent extracts user objective and constraints, queries approved vendor catalogues via MCP read tools, and builds a structured execution proposal.",
    layer: "ai",
    state: "completed",
  },
  {
    id: "step-gateway",
    title: "2. Runtime Gateway, Policy, Budget & Permit Issuance",
    description:
      "Governance Layer independently verifies identity, capability bindings, OPA Rego policy, atomic Redis budget reservation, risk tier, and issues a short-lived Ed25519 JWS permit.",
    layer: "governance",
    state: "completed",
  },
  {
    id: "step-execution",
    title: "3. Permit-Gated Enterprise Execution & Decision Receipt",
    description:
      "Protected Enterprise Service verifies the single-use permit signature, canonical parameter hash, and revocation epoch before executing and appending a hash-linked receipt.",
    layer: "enterprise",
    state: "completed",
  },
];

export default function HomePage() {
  return (
    <ErrorBoundary fallbackTitle="Overview Unavailable">
      <div>
        <Card>
          <Badge variant="info">Enterprise Governance Control Plane</Badge>
          <h1 className="page-title">Neolith</h1>
          <p className="page-lead">
            <strong>AI-Powered Agentic Decision and Execution System</strong> —
            an enterprise architecture that separates intelligent goal
            understanding, research, comparison, and planning from deterministic
            execution authority.
          </p>
        </Card>

        <section className="section-grid" aria-label="Architecture layers">
          <Card as="article">
            <CardHeader
              title="1. AI Agent Layer"
              badge={<RiskTierBadge tier="R1" />}
            />
            <p className="card-copy">
              Interprets user goals, retrieves approved information, compares
              alternatives, creates structured plans, and proposes execution
              requests without holding direct execution authority.
            </p>
          </Card>

          <Card as="article">
            <CardHeader
              title="2. Governance & Execution Control Layer"
              badge={<RiskTierBadge tier="R3" />}
            />
            <p className="card-copy">
              Independently validates requester and agent identity, permissions,
              deterministic OPA policy, atomic budget reservations, risk
              tiering, human approvals, short-lived execution permits, and
              decision receipts.
            </p>
          </Card>

          <Card as="article">
            <CardHeader
              title="3. Enterprise Services Layer"
              badge={<RiskTierBadge tier="R2" />}
            />
            <p className="card-copy">
              Executes protected operations only when presented with a valid,
              unrevoked, single-use execution permit bound to exact action
              parameters.
            </p>
          </Card>
        </section>

        <Card style={{ marginTop: "1.25rem" }}>
          <CardHeader
            title="Governed Execution Pipeline"
            subtitle="Separation of AI reasoning from deterministic execution authority across the 3 system layers."
          />
          <StatusTimeline steps={ARCHITECTURE_FLOW_STEPS} />
        </Card>

        <section className="section-grid" aria-label="Application workspaces">
          <Card as="article">
            <h2 className="card-title">
              <Link href="/tasks">Task Workspace &rarr;</Link>
            </h2>
            <p className="card-copy">
              Requester workspace for submitting structured enterprise goals,
              reviewing grounded comparisons, and tracking governance states.
            </p>
          </Card>

          <Card as="article">
            <h2 className="card-title">
              <Link href="/operator">Operator Control Plane &rarr;</Link>
            </h2>
            <p className="card-copy">
              Operator shell for agent and tool registries, permission bindings,
              policy versions, budgets, revocation controls, and audit evidence.
            </p>
          </Card>
        </section>

        <Card aria-label="Registered contract schemas">
          <CardHeader
            title="Canonical Contract Schemas"
            subtitle="Machine-readable JSON Schema Draft 2020-12 contracts enforced at the Runtime Gateway."
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <CopyableId
              label="Execution Envelope"
              value={CONTRACT_SCHEMA_IDS.executionRequest}
            />
            <CopyableId
              label="Execution Permit"
              value={CONTRACT_SCHEMA_IDS.executionPermit}
            />
            <CopyableId
              label="Decision Receipt"
              value={CONTRACT_SCHEMA_IDS.decisionReceipt}
            />
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
