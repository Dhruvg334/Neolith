import {
  Badge,
  BudgetMeter,
  Card,
  CardHeader,
  DecisionBadge,
  ReasonCodeList,
} from "@/components/ui";

const SAMPLE_REASON_CODES = [
  "BASE_POLICY_ALLOW",
  "BUDGET_EXCEEDED",
  "APPROVAL_THRESHOLD_REACHED",
  "PERMIT_REPLAY",
  "PARAMETER_HASH_MISMATCH",
  "REVOCATION_EPOCH_MISMATCH",
] as const;

export default function OperatorPage() {
  return (
    <div>
      <Card>
        <Badge variant="info">Operator View</Badge>
        <h1 className="page-title">Operator Control Plane</h1>
        <p className="page-lead">
          Administrative interface for registered agents, tool versions,
          permission bindings, deterministic Rego policies, budgets, runtime
          containment, and assurance evaluation runs.
        </p>
      </Card>

      <section className="section-grid" aria-label="Operator subsystems">
        <Card as="article">
          <CardHeader
            title="Agent & Tool Registry"
            badge={<Badge variant="neutral">Phase 1</Badge>}
          />
          <p className="card-copy">
            Tracks immutable agent versions, tool schemas, risk tiers, and
            reversibility declarations.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Permissions & Policy Engine"
            badge={<Badge variant="neutral">Phase 3</Badge>}
          />
          <p className="card-copy">
            Manages deterministic capability bindings and versioned Open Policy
            Agent bundles.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Budgets & Execution Permits"
            badge={<Badge variant="neutral">Phase 4</Badge>}
          />
          <p className="card-copy">
            Oversees transactional budget limits, pre-execution reservations,
            and short-lived Ed25519 permits.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Revocation & Incident Control"
            badge={<Badge variant="neutral">Phase 6</Badge>}
          />
          <p className="card-copy">
            Provides agent quarantine and revocation-epoch emergency stop
            controls backed by server-side enforcement.
          </p>
        </Card>
      </section>

      <Card style={{ marginTop: "1.25rem" }}>
        <CardHeader
          title="Reference Budget Envelope Specification (F06)"
          subtitle="Exact decimal representation used for pre-execution reservation and settlement."
        />
        <BudgetMeter
          label="Procurement Demo Scenario Envelope (001_procurement_happy_path)"
          currency="INR"
          limitAmount="8000.00"
          committedAmount="0.00"
          reservedAmount="6000.00"
          availableAmount="2000.00"
        />
      </Card>

      <Card>
        <CardHeader
          title="Deterministic Governance Outcomes & Reason Code Dictionary"
          subtitle="Structured reason codes emitted by package neolith.decision and the Runtime Gateway."
          action={
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <DecisionBadge decision="allow" />
              <DecisionBadge decision="review" />
              <DecisionBadge decision="deny" />
            </div>
          }
        />
        <ReasonCodeList codes={SAMPLE_REASON_CODES} />
      </Card>
    </div>
  );
}
