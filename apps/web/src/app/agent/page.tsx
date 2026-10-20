import { AgentTaskConsole } from "@/components/AgentTaskConsole";
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  RiskTierBadge,
  StatusTimeline,
  type DataTableColumn,
  type TimelineStep,
} from "@/components/ui";
import {
  FALLBACK_INVOICES,
  FALLBACK_SUMMARY,
  FALLBACK_TOOLS,
  fetchApiWithFallback,
  type FinancialSummaryDto,
  type FinancialToolMetadataDto,
  type InvoiceDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

const AGENT_PIPELINE_PREVIEW: readonly TimelineStep[] = [
  {
    id: "step-context",
    title: "1. Read-Only Financial Context Ingestion (R1)",
    layer: "ai",
    state: "completed",
    description:
      "Agent inspects Operations Account balance (INR 100,000.00), category budgets, and unpaid invoices (INV-001, INV-002, INV-003).",
  },
  {
    id: "step-proposal",
    title: "2. Candidate FinancialActionProposal Generation",
    layer: "ai",
    state: "active",
    description:
      "Agent emits a typed FinancialActionProposal (e.g., pay_invoice) with justification and evidence_refs — never direct execution.",
  },
  {
    id: "step-gateway",
    title: "3. Runtime Gateway Policy, Budget & Risk Evaluation (Stage 2)",
    layer: "governance",
    state: "pending",
    description:
      "Neolith evaluates RBAC/ABAC capabilities, OPA Rego policies, category budget limits, and vendor verification status.",
  },
  {
    id: "step-settlement",
    title: "4. Permit-Verified Settlement in Banking Simulator (Stage 2)",
    layer: "enterprise",
    state: "pending",
    description:
      "Protected write tools verify the Ed25519 ExecutionPermit before debiting Operations Account.",
  },
];

const TOOL_COLUMNS: readonly DataTableColumn<FinancialToolMetadataDto>[] = [
  {
    key: "name",
    header: "Tool Name",
    render: (row) => (
      <span>
        <strong>
          <code className="inline-code">{row.name}</code>
        </strong>{" "}
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          v{row.version}
        </span>
      </span>
    ),
  },
  {
    key: "mode",
    header: "Access Mode",
    render: (row) => (
      <Badge variant={row.protected ? "review" : "allow"}>
        {row.protected ? "PROTECTED WRITE (PERMIT REQUIRED)" : "READ-ONLY"}
      </Badge>
    ),
  },
  {
    key: "risk",
    header: "Risk Tier",
    render: (row) => <RiskTierBadge tier={row.risk_tier} />,
  },
  {
    key: "capability",
    header: "Required Capability",
    render: (row) => (
      <code className="inline-code">{row.required_capability}</code>
    ),
  },
  {
    key: "description",
    header: "Description",
    render: (row) => row.description,
  },
];

export default async function FinancialAgentPage() {
  const [summaryRes, invoicesRes, toolsRes] = await Promise.all([
    fetchApiWithFallback<FinancialSummaryDto>(
      "/financial/summary",
      FALLBACK_SUMMARY
    ),
    fetchApiWithFallback<readonly InvoiceDto[]>(
      "/financial/invoices?status=unpaid",
      FALLBACK_INVOICES
    ),
    fetchApiWithFallback<readonly FinancialToolMetadataDto[]>(
      "/financial/tools",
      FALLBACK_TOOLS
    ),
  ]);

  const summary = summaryRes.data;
  const unpaidInvoices = invoicesRes.data;
  const tools = toolsRes.data;

  return (
    <div>
      <Card>
        <Badge variant="info">Financial AI Agent Console</Badge>
        <h1 className="page-title">
          Financial Agent Workspace (<code className="inline-code">financial-ai-agent</code>)
        </h1>
        <p className="page-lead">
          Interactive console for the Financial Operations AI Agent. The agent
          can inspect treasury balances, invoices, beneficiaries, and category
          budgets, and formulate structured{" "}
          <code className="inline-code">FinancialActionProposal</code>{" "}
          envelopes. It holds zero implicit execution authority.
        </p>
      </Card>

      <AgentTaskConsole />

      <Card>
        <CardHeader
          title="Live FinancialContext Snapshot (Exposed to Agent Planner)"
          subtitle="Read-only state bound to FinancialContext in services/agent-worker/src/neolith_agent/state.py."
        />
        <div className="section-grid">
          <div>
            <p className="card-copy">
              <strong>Account:</strong>{" "}
              {summary.primary_account?.name ?? "Operations Account"}
            </p>
            <p className="card-copy">
              <strong>Available Balance:</strong>{" "}
              <code className="inline-code">
                {summary.currency} {summary.total_available_balance}
              </code>
            </p>
            <p className="card-copy">
              <strong>Category Budgets:</strong>
            </p>
            <ul style={{ margin: "0.35rem 0 0 1.2rem", fontSize: "0.9rem" }}>
              {summary.monthly_budgets.map((b) => (
                <li key={b.id}>
                  <code className="inline-code">{b.category}</code>:{" "}
                  {b.currency} {b.available_amount} available / {b.limit_amount}{" "}
                  limit
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="card-copy">
              <strong>Unpaid Invoices in Context ({unpaidInvoices.length}):</strong>
            </p>
            <ul style={{ margin: "0.35rem 0 0 1.2rem", fontSize: "0.9rem" }}>
              {unpaidInvoices.map((inv) => (
                <li key={inv.id} style={{ marginBottom: "0.35rem" }}>
                  <strong>{inv.invoice_number}</strong> — {inv.vendor_name} (
                  <code className="inline-code">
                    {inv.currency} {inv.amount}
                  </code>
                  , {inv.category},{" "}
                  {inv.is_verified_vendor ? "verified" : "unverified vendor"})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Agent Planning vs. Runtime Gateway Governance Pipeline"
          subtitle="Architectural boundary separating AI reasoning from deterministic payment execution."
        />
        <StatusTimeline steps={AGENT_PIPELINE_PREVIEW} />
      </Card>

      <Card>
        <CardHeader
          title="Registered Financial Agent Tools (5 Read-Only, 4 Protected Write)"
          subtitle="Tool metadata persisted in PostgreSQL and enforced by the Runtime Gateway."
        />
        <DataTable
          columns={TOOL_COLUMNS}
          rows={tools}
          getRowKey={(row) => row.name}
        />
      </Card>
    </div>
  );
}
