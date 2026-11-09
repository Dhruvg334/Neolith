import { ErrorState } from "@/components/ErrorState";
import {
  Badge,
  BudgetMeter,
  Card,
  CardHeader,
  CopyableId,
  DataTable,
  DecisionBadge,
  ReasonCodeList,
  RiskTierBadge,
  type DataTableColumn,
} from "@/components/ui";
import {
  fetchApiResult,
  type AgentRegistryDto,
  type FinancialCategoryBudgetDto,
  type FinancialToolMetadataDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

const SAMPLE_REASON_CODES = [
  "BASE_POLICY_ALLOW",
  "BUDGET_EXCEEDED",
  "APPROVAL_THRESHOLD_REACHED",
  "PERMIT_REPLAY",
  "PARAMETER_HASH_MISMATCH",
  "REVOCATION_EPOCH_MISMATCH",
] as const;

const AGENT_COLUMNS: readonly DataTableColumn<AgentRegistryDto>[] = [
  {
    key: "name",
    header: "Agent Identity",
    render: (row) => (
      <div>
        <strong>
          <code className="inline-code">{row.name}</code>
        </strong>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          {row.description}
        </div>
      </div>
    ),
  },
  {
    key: "version",
    header: "Active Version",
    render: (row) => (
      <code className="inline-code">v{row.active_version ?? "0.1.0"}</code>
    ),
  },
  {
    key: "framework",
    header: "Framework",
    render: (row) => row.framework ?? "langgraph",
  },
  {
    key: "tools",
    header: "Bound Tools",
    render: (row) => `${row.allowed_tools.length} tools`,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={row.status === "active" ? "allow" : "deny"}>
        {row.status.toUpperCase()}
      </Badge>
    ),
  },
];

const TOOL_COLUMNS: readonly DataTableColumn<FinancialToolMetadataDto>[] = [
  {
    key: "name",
    header: "Tool Name",
    render: (row) => (
      <strong>
        <code className="inline-code">{row.name}</code>
      </strong>
    ),
  },
  {
    key: "access",
    header: "Execution Classification",
    render: (row) => (
      <Badge variant={row.protected ? "review" : "allow"}>
        {row.protected ? "PROTECTED WRITE" : "READ-ONLY"}
      </Badge>
    ),
  },
  {
    key: "risk_tier",
    header: "Risk Tier",
    render: (row) => <RiskTierBadge tier={row.risk_tier} />,
  },
  {
    key: "reversibility",
    header: "Reversibility",
    render: (row) => <code className="inline-code">{row.reversibility}</code>,
  },
  {
    key: "capability",
    header: "Required Capability",
    render: (row) => (
      <code className="inline-code">{row.required_capability}</code>
    ),
  },
  {
    key: "hash",
    header: "Schema Hash",
    render: (row) => (
      <CopyableId
        label="schema"
        value={row.description_hash}
        truncateLength={10}
      />
    ),
  },
];

export default async function OperatorPage() {
  const [agentsRes, toolsRes, budgetsRes] = await Promise.all([
    fetchApiResult<readonly AgentRegistryDto[]>("/agents"),
    fetchApiResult<readonly FinancialToolMetadataDto[]>("/tools"),
    fetchApiResult<readonly FinancialCategoryBudgetDto[]>("/financial/budgets"),
  ]);

  if (agentsRes.status === "error" && toolsRes.status === "error") {
    return (
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <ErrorState
          title={agentsRes.isStarting ? "Starting secure service" : "Secure service unavailable"}
          message={
            agentsRes.isStarting
              ? "Neolith is reconnecting. This can take a moment after inactivity on hosted services."
              : "We couldn't reach Neolith's secure service to retrieve operator registries."
          }
          isStarting={agentsRes.isStarting}
          details={agentsRes.error}
        />
      </div>
    );
  }

  const agents = agentsRes.status === "success" ? agentsRes.data : [];
  const tools = toolsRes.status === "success" ? toolsRes.data : [];
  const budgets = budgetsRes.status === "success" ? budgetsRes.data : [];
  const readOnlyCount = tools.filter((t) => t.read_only).length;
  const protectedCount = tools.filter((t) => t.protected).length;

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <Badge variant="info">Operator Governance Control Plane</Badge>
          <Badge variant={agentsRes.status === "success" ? "allow" : "review"}>
            {agentsRes.status === "success"
              ? "System Online — Live Registry"
              : "Connecting to Backend..."}
          </Badge>
        </div>
        <h1 className="page-title">Operator Control Plane</h1>
        <p className="page-lead">
          Administrative oversight for registered AI agents, pinned tool
          manifests, risk classifications (<code className="inline-code">R1</code>
          –<code className="inline-code">R4</code>), authoritative category
          budgets, and deterministic Runtime Gateway reason codes.
        </p>
      </Card>

      <section className="section-grid" aria-label="Operator telemetry">
        <Card as="article">
          <CardHeader
            title="Registered AI Agents"
            badge={<Badge variant="allow">{agents.length} ACTIVE</Badge>}
          />
          <p className="card-copy">
            Immutable agent manifests pinned with SHA-256 artifact digests and
            explicit tool allowlists.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Read-Only Tools (R1)"
            badge={<Badge variant="allow">{readOnlyCount} TOOLS</Badge>}
          />
          <p className="card-copy">
            Safe telemetry lookups (<code className="inline-code">get_account_balance</code>
            , <code className="inline-code">get_invoice</code>,{" "}
            <code className="inline-code">get_budget_status</code>) available for
            agent planning.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Protected Write Tools (R2–R4)"
            badge={<Badge variant="review">{protectedCount} GATED</Badge>}
          />
          <p className="card-copy">
            Mutating financial tools (<code className="inline-code">pay_invoice</code>
            , <code className="inline-code">transfer_funds</code>,{" "}
            <code className="inline-code">add_beneficiary</code>,{" "}
            <code className="inline-code">cancel_payment</code>) requiring
            signed Runtime Gateway permits.
          </p>
        </Card>
      </section>

      <Card style={{ marginTop: "1.25rem" }}>
        <CardHeader
          title="Registered Agent Manifests (GET /api/v1/agents)"
          subtitle="Logical agents and their active deployment versions."
        />
        <DataTable
          columns={AGENT_COLUMNS}
          rows={agents}
          getRowKey={(row) => row.id}
        />
      </Card>

      <Card>
        <CardHeader
          title="Registered Tool Versions & Risk Classifications (GET /api/v1/tools)"
          subtitle="Distinguishes R1 read-only context tools from R2–R4 permit-enforced write tools."
        />
        <DataTable
          columns={TOOL_COLUMNS}
          rows={tools}
          getRowKey={(row) => row.name}
        />
      </Card>

      <Card>
        <CardHeader
          title="Authoritative Category Budgets (GET /api/v1/financial/budgets)"
          subtitle="Monthly spend caps enforced for Neolith Finance."
        />
        <div style={{ display: "grid", gap: "1rem" }}>
          {budgets.map((budget) => (
            <BudgetMeter
              key={budget.id}
              label={`Category: ${budget.category.toUpperCase()} (Approval Threshold: ${budget.currency} ${budget.approval_threshold ?? "N/A"})`}
              currency={budget.currency}
              limitAmount={budget.limit_amount}
              committedAmount={budget.used_amount}
              reservedAmount="0.00"
              availableAmount={budget.available_amount}
            />
          ))}
        </div>
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
