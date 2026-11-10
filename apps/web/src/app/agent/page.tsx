import type { Metadata } from "next";
import { AgentInterfaceSwitcher } from "@/components/AgentInterfaceSwitcher";
import { ErrorState } from "@/components/ErrorState";
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
  FALLBACK_SUMMARY,
  FALLBACK_TOOLS,
  fetchApiResult,
  formatInrCurrency,
  type FinancialSummaryDto,
  type FinancialToolMetadataDto,
  type InvoiceDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financial AI Agent",
  description:
    "Multi-channel conversational financial assistant operating with zero execution authority across Web, WhatsApp, and Voice.",
  alternates: {
    canonical: "/agent",
  },
};

const AGENT_PIPELINE_PREVIEW: readonly TimelineStep[] = [
  {
    id: "step-context",
    title: "1. Read-Only Financial Context Ingestion (R1)",
    layer: "ai",
    state: "completed",
    description:
      "Agent inspects Operations Account balance (INR 100,000.00), category budgets, and unpaid invoices (INV-001, INV-002, INV-003) via FinancialContextClient.",
  },
  {
    id: "step-proposal",
    title: "2. Candidate FinancialActionProposal Generation",
    layer: "ai",
    state: "completed",
    description:
      "Agent synthesises retrieved evidence into a typed FinancialActionProposal (e.g. pay_invoice) with justification — never direct execution.",
  },
  {
    id: "step-gateway",
    title: "3. Runtime Gateway Policy, Budget & Risk Evaluation",
    layer: "governance",
    state: "pending",
    description:
      "Neolith governance evaluates RBAC/ABAC capabilities, OPA Rego policies, atomic Redis budget limits, and vendor verification status.",
  },
  {
    id: "step-settlement",
    title: "4. Permit-Verified Settlement in Banking Simulator",
    layer: "enterprise",
    state: "pending",
    description:
      "Protected banking write tools verify an Ed25519 ExecutionPermit before debiting the Operations Account.",
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
    fetchApiResult<FinancialSummaryDto>("/financial/summary"),
    fetchApiResult<readonly InvoiceDto[]>("/financial/invoices?status=unpaid"),
    fetchApiResult<readonly FinancialToolMetadataDto[]>("/financial/tools"),
  ]);

  if (summaryRes.status === "error" && invoicesRes.status === "error") {
    return (
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <ErrorState
          title={summaryRes.isStarting ? "Starting secure service" : "Secure service unavailable"}
          message={
            summaryRes.isStarting
              ? "Neolith is reconnecting. This can take a moment after inactivity on hosted services."
              : "We couldn't reach Neolith's secure service. Please verify your connection or try again."
          }
          isStarting={summaryRes.isStarting}
          details={summaryRes.error}
        />
      </div>
    );
  }

  const summary = summaryRes.status === "success" ? summaryRes.data : FALLBACK_SUMMARY;
  const unpaidInvoices = invoicesRes.status === "success" ? invoicesRes.data : [];
  const tools = toolsRes.status === "success" ? toolsRes.data : FALLBACK_TOOLS;

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
            marginBottom: "0.5rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant="info">Financial AI Agent</Badge>
            <Badge variant="neutral">Multi-Channel: Web &bull; WhatsApp &bull; Voice</Badge>
            <Badge variant="neutral">Framework: LangGraph</Badge>
          </div>
          <Badge variant={summaryRes.status === "success" ? "allow" : "review"}>
            {summaryRes.status === "success" ? "Connected to Live Backend" : "Connecting..."}
          </Badge>
        </div>
        <h1 className="page-title">
          Financial Agent Workspace (<code className="inline-code">financial-ai-agent:0.1.0</code>)
        </h1>
        <p className="page-lead">
          Multi-channel operations console for the Financial AI Agent. Accessible seamlessly via
          Web, WhatsApp, and Voice (ElevenLabs). The agent evaluates accounts payable, invoices, and category
          budgets via read-only APIs, formulating structured <code className="inline-code">FinancialActionProposal</code> envelopes.
          All execution remains governed under the Runtime Gateway policy engine.
        </p>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <AgentInterfaceSwitcher />
        </div>

        <div>
          <Card>
            <CardHeader
              title="Live FinancialContext Snapshot (Read-Only Context)"
              subtitle="Sandbox state consumed by FinancialContextClient (services/agent-worker/src/neolith_agent/client.py)."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <p className="card-copy" style={{ marginBottom: "0.25rem" }}>
                  <strong>Operating Account:</strong>{" "}
                  {summary.primary_account?.name ?? "Operations Account"}
                </p>
                <p className="card-copy" style={{ marginBottom: "0.5rem" }}>
                  <strong>Available Balance:</strong>{" "}
                  <code className="inline-code" style={{ fontSize: "1rem" }}>
                    {formatInrCurrency(summary.total_available_balance, summary.currency)}
                  </code>
                </p>
                <p className="card-copy" style={{ marginBottom: "0.25rem" }}>
                  <strong>Category Budgets:</strong>
                </p>
                <ul style={{ margin: "0.25rem 0 0 1.2rem", fontSize: "0.88rem" }}>
                  {summary.monthly_budgets.map((b) => (
                    <li key={b.id} style={{ marginBottom: "0.2rem" }}>
                      <code className="inline-code">{b.category}</code>:{" "}
                      <strong>{formatInrCurrency(b.available_amount, b.currency)}</strong> available / {formatInrCurrency(b.limit_amount, b.currency)} limit
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}>
                <p className="card-copy" style={{ marginBottom: "0.35rem" }}>
                  <strong>Unpaid Invoices in Context ({unpaidInvoices.length}):</strong>
                </p>
                <ul style={{ margin: "0.25rem 0 0 1.2rem", fontSize: "0.88rem" }}>
                  {unpaidInvoices.map((inv) => (
                    <li key={inv.id} style={{ marginBottom: "0.45rem" }}>
                      <strong>{inv.invoice_number}</strong> — {inv.vendor_name} (
                      <code className="inline-code">
                        {formatInrCurrency(inv.amount, inv.currency)}
                      </code>
                      , {inv.category},{" "}
                      <span style={{ color: inv.is_verified_vendor ? "var(--allow-fg)" : "var(--deny-fg)" }}>
                        {inv.is_verified_vendor ? "verified" : "unverified"}
                      </span>
                      )
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

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
