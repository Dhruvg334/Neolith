import type { Metadata } from "next";
import { ErrorState } from "@/components/ErrorState";
import {
  Badge,
  Card,
  CardHeader,
  CopyableId,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from "@/components/ui";
import {
  fetchApiResult,
  type BeneficiaryDto,
  type FinancialAccountDto,
  type FinancialTransactionDto,
  type InvoiceDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accounts & Invoices",
  description:
    "Synthetic financial accounts, verified vendor directory, and payable vendor invoice queues.",
  alternates: {
    canonical: "/accounts",
  },
};

const INVOICE_COLUMNS: readonly DataTableColumn<InvoiceDto>[] = [
  {
    key: "invoice_number",
    header: "Invoice #",
    render: (row) => (
      <strong>
        <code className="inline-code">{row.invoice_number}</code>
      </strong>
    ),
  },
  {
    key: "vendor",
    header: "Vendor",
    render: (row) => row.vendor_name,
  },
  {
    key: "category",
    header: "Category",
    render: (row) => <code className="inline-code">{row.category}</code>,
  },
  {
    key: "amount",
    header: "Amount",
    render: (row) => (
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {row.currency} {row.amount}
      </span>
    ),
  },
  {
    key: "verified",
    header: "Vendor Verification",
    render: (row) => (
      <Badge variant={row.is_verified_vendor ? "allow" : "deny"}>
        {row.is_verified_vendor ? "VERIFIED" : "UNVERIFIED"}
      </Badge>
    ),
  },
  {
    key: "due_date",
    header: "Due Date",
    render: (row) => row.due_date,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={row.status === "paid" ? "allow" : "review"}>
        {row.status.toUpperCase()}
      </Badge>
    ),
  },
];

const BENEFICIARY_COLUMNS: readonly DataTableColumn<BeneficiaryDto>[] = [
  {
    key: "name",
    header: "Beneficiary Name",
    render: (row) => <strong>{row.name}</strong>,
  },
  {
    key: "reference",
    header: "Bank Reference",
    render: (row) => <code className="inline-code">{row.reference}</code>,
  },
  {
    key: "verified",
    header: "Verification Status",
    render: (row) => (
      <Badge variant={row.verified ? "allow" : "deny"}>
        {row.verified ? "VERIFIED VENDOR" : "UNVERIFIED"}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Account Status",
    render: (row) => (
      <Badge variant={row.status === "active" ? "allow" : "review"}>
        {row.status.toUpperCase()}
      </Badge>
    ),
  },
];

const TRANSACTION_COLUMNS: readonly DataTableColumn<FinancialTransactionDto>[] = [
  {
    key: "id",
    header: "Transaction ID",
    render: (row) => <CopyableId label="tx" value={row.id} truncateLength={10} />,
  },
  {
    key: "type",
    header: "Operation Type",
    render: (row) => <code className="inline-code">{row.transaction_type}</code>,
  },
  {
    key: "amount",
    header: "Amount",
    render: (row) => (
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {row.currency} {row.amount}
      </span>
    ),
  },
  {
    key: "status",
    header: "Settlement Status",
    render: (row) => (
      <Badge variant={row.status === "completed" ? "allow" : "neutral"}>
        {row.status.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: "reference",
    header: "Ledger Reference",
    render: (row) => row.reference,
  },
];

export default async function AccountsPage() {
  const [accountsRes, invoicesRes, beneficiariesRes, transactionsRes] =
    await Promise.all([
      fetchApiResult<readonly FinancialAccountDto[]>("/financial/accounts"),
      fetchApiResult<readonly InvoiceDto[]>("/financial/invoices"),
      fetchApiResult<readonly BeneficiaryDto[]>("/financial/beneficiaries"),
      fetchApiResult<readonly FinancialTransactionDto[]>("/financial/transactions"),
    ]);

  if (
    accountsRes.status === "error" &&
    invoicesRes.status === "error"
  ) {
    return (
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <ErrorState
          title={accountsRes.isStarting ? "Starting secure service" : "Secure service unavailable"}
          message={
            accountsRes.isStarting
              ? "Neolith is reconnecting. This can take a moment after inactivity on hosted services."
              : "We couldn't reach Neolith's secure service to retrieve financial ledger records."
          }
          isStarting={accountsRes.isStarting}
          details={accountsRes.error}
        />
      </div>
    );
  }

  const accounts = accountsRes.status === "success" ? accountsRes.data : [];
  const invoices = invoicesRes.status === "success" ? invoicesRes.data : [];
  const beneficiaries = beneficiariesRes.status === "success" ? beneficiariesRes.data : [];
  const transactions = transactionsRes.status === "success" ? transactionsRes.data : [];

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
          <Badge variant="info">Treasury &amp; Accounts Payable Ledger</Badge>
          <Badge variant={accountsRes.status === "success" ? "allow" : "review"}>
            {accountsRes.status === "success" ? "Live Database State" : "Reconnecting..."}
          </Badge>
        </div>
        <h1 className="page-title">Accounts, Invoices &amp; Beneficiaries</h1>
        <p className="page-lead">
          Synthetic financial state for Neolith Finance. Includes verified and
          unverified vendor invoices designed to exercise allow, human-approval,
          and policy-deny paths through the Runtime Gateway.
        </p>
      </Card>

      <section className="section-grid" aria-label="Treasury accounts">
        {accounts.map((account) => (
          <Card key={account.id} as="article">
            <CardHeader
              title={`${account.name} (${account.organisation_name})`}
              badge={<Badge variant="allow">{account.status.toUpperCase()}</Badge>}
            />
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                margin: "0.35rem 0",
              }}
            >
              {account.currency} {account.available_balance}
            </p>
            <div style={{ marginTop: "0.5rem" }}>
              <CopyableId label="account_id" value={account.id} />
            </div>
          </Card>
        ))}
      </section>

      <Card style={{ marginTop: "1.25rem" }}>
        <CardHeader
          title="Vendor Invoices (Accounts Payable)"
          subtitle="INV-001 (within software budget), INV-002 (high-value infrastructure), and INV-003 (unverified vendor & over miscellaneous cap)."
        />
        {invoices.length === 0 ? (
          <EmptyState
            title="No Invoices Found"
            description="Seed the financial reference dataset to populate INV-001, INV-002, and INV-003."
          />
        ) : (
          <DataTable
            columns={INVOICE_COLUMNS}
            rows={invoices}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Registered Payment Beneficiaries"
          subtitle="Beneficiary verification status inspected by the Runtime Gateway before permitting payments."
        />
        {beneficiaries.length === 0 ? (
          <EmptyState
            title="No Beneficiaries Registered"
            description="Beneficiaries will appear here once seeded."
          />
        ) : (
          <DataTable
            columns={BENEFICIARY_COLUMNS}
            rows={beneficiaries}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Financial Transaction Ledger"
          subtitle="All settled and pending treasury movements."
        />
        {transactions.length === 0 ? (
          <EmptyState
            title="No Ledger Transactions"
            description="Transactions will appear here once seeded or executed."
          />
        ) : (
          <DataTable
            columns={TRANSACTION_COLUMNS}
            rows={transactions}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  );
}
