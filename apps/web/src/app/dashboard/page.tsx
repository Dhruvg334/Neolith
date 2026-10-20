import Link from "next/link";
import {
  Badge,
  BudgetMeter,
  Card,
  CardHeader,
  CopyableId,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from "@/components/ui";
import {
  FALLBACK_SUMMARY,
  fetchApiWithFallback,
  type FinancialSummaryDto,
  type FinancialTransactionDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

const TRANSACTION_COLUMNS: readonly DataTableColumn<FinancialTransactionDto>[] = [
  {
    key: "id",
    header: "Transaction ID",
    render: (row) => <CopyableId label="tx" value={row.id} truncateLength={10} />,
  },
  {
    key: "type",
    header: "Type",
    render: (row) => <code className="inline-code">{row.transaction_type}</code>,
  },
  {
    key: "category",
    header: "Category",
    render: (row) => row.category ?? "—",
  },
  {
    key: "amount",
    header: "Amount",
    render: (row) => (
      <strong>
        {row.currency} {row.amount}
      </strong>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={row.status === "completed" ? "allow" : "neutral"}>
        {row.status.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: "reference",
    header: "Reference",
    render: (row) => row.reference,
  },
];

export default async function FinancialDashboardPage() {
  const result = await fetchApiWithFallback<FinancialSummaryDto>(
    "/financial/summary",
    FALLBACK_SUMMARY
  );
  const summary = result.data;

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
          <Badge variant="info">Financial Reference Application (F16)</Badge>
          <Badge variant={result.live ? "allow" : "review"}>
            {result.live
              ? "Connected to Live FastAPI Sandbox"
              : "Seed Baseline Snapshot (API Offline)"}
          </Badge>
        </div>
        <h1 className="page-title">
          Financial Dashboard — {summary.organisation_name}
        </h1>
        <p className="page-lead">
          Synthetic enterprise treasury, accounts-payable, and category budget
          telemetry governed by Neolith&apos;s Runtime Gateway. All protected
          write actions require deterministic policy evaluation, budget
          reservation, and a signed execution permit.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.65rem",
            flexWrap: "wrap",
            marginTop: "1rem",
          }}
        >
          <Link href="/agent" className="ui-btn ui-btn-primary ui-btn-md">
            Launch Financial Agent Console
          </Link>
          <Link href="/accounts" className="ui-btn ui-btn-secondary ui-btn-md">
            Inspect Accounts &amp; Invoices
          </Link>
          <Link href="/tasks" className="ui-btn ui-btn-outline ui-btn-md">
            View Task Registry
          </Link>
          <Link href="/operator" className="ui-btn ui-btn-outline ui-btn-md">
            Operator Governance View
          </Link>
        </div>
      </Card>

      <section className="section-grid" aria-label="Treasury summary metrics">
        <Card as="article">
          <CardHeader
            title="Operations Account Balance"
            badge={<Badge variant="allow">ACTIVE</Badge>}
          />
          <p
            style={{
              fontSize: "1.65rem",
              fontWeight: 700,
              margin: "0.25rem 0",
              fontFamily: "var(--font-mono)",
            }}
          >
            {summary.currency} {summary.total_available_balance}
          </p>
          <p className="card-copy">
            Account:{" "}
            <strong>
              {summary.primary_account?.name ?? "Operations Account"}
            </strong>{" "}
            ({summary.organisation_name})
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Unpaid Vendor Invoices"
            badge={
              <Badge variant="review">
                {summary.unpaid_invoice_count} PENDING
              </Badge>
            }
          />
          <p
            style={{
              fontSize: "1.65rem",
              fontWeight: 700,
              margin: "0.25rem 0",
              fontFamily: "var(--font-mono)",
            }}
          >
            {summary.currency} {summary.unpaid_invoice_value}
          </p>
          <p className="card-copy">
            Aggregate value across {summary.unpaid_invoice_count} unpaid vendor
            invoices awaiting governed agent processing.
          </p>
        </Card>

        <Card as="article">
          <CardHeader
            title="Execution Authority Posture"
            badge={<Badge variant="info">ZERO IMPLICIT AUTHORITY</Badge>}
          />
          <p className="card-copy">
            The Financial Agent can freely query read-only tools (
            <code className="inline-code">R1</code>) but cannot directly invoke{" "}
            <code className="inline-code">pay_invoice</code> or{" "}
            <code className="inline-code">transfer_funds</code> without a
            Runtime Gateway permit.
          </p>
        </Card>
      </section>

      <Card style={{ marginTop: "1.25rem" }}>
        <CardHeader
          title="Monthly Category Budgets (Authoritative Limits)"
          subtitle="Exact Decimal category envelopes enforced before payment execution."
        />
        {summary.monthly_budgets.length === 0 ? (
          <EmptyState
            title="No Category Budgets Found"
            description="Run the deterministic seed script to populate software, infrastructure, and miscellaneous budgets."
          />
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {summary.monthly_budgets.map((budget) => (
              <BudgetMeter
                key={budget.id}
                label={`Category: ${budget.category.toUpperCase()} (${budget.period_type})`}
                currency={budget.currency}
                limitAmount={budget.limit_amount}
                committedAmount={budget.used_amount}
                reservedAmount="0.00"
                availableAmount={budget.available_amount}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent Financial Ledger Transactions"
          subtitle="Immutable ledger entries recorded in the Financial Reference Application."
        />
        {summary.recent_transactions.length === 0 ? (
          <EmptyState
            title="No Transactions Recorded"
            description="Completed invoice payments and treasury allocations appear here."
          />
        ) : (
          <DataTable
            columns={TRANSACTION_COLUMNS}
            rows={summary.recent_transactions}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  );
}
