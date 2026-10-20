/**
 * Typed client and fallback seed snapshot for Stage 1 Financial Reference Application APIs.
 */

export interface FinancialAccountDto {
  readonly id: string;
  readonly organisation_name: string;
  readonly name: string;
  readonly account_type: string;
  readonly currency: string;
  readonly available_balance: string;
  readonly status: "active" | "frozen" | "closed";
  readonly created_at: string;
  readonly updated_at: string;
}

export interface BeneficiaryDto {
  readonly id: string;
  readonly name: string;
  readonly reference: string;
  readonly status: "active" | "pending" | "blocked";
  readonly verified: boolean;
  readonly created_at: string;
}

export interface InvoiceDto {
  readonly id: string;
  readonly invoice_number: string;
  readonly vendor_name: string;
  readonly vendor_id?: string | null;
  readonly category: string;
  readonly amount: string;
  readonly currency: string;
  readonly due_date: string;
  readonly status: "unpaid" | "pending_approval" | "paid" | "cancelled" | "overdue";
  readonly is_verified_vendor: boolean;
  readonly description?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface FinancialTransactionDto {
  readonly id: string;
  readonly transaction_type: string;
  readonly account_id: string;
  readonly invoice_id?: string | null;
  readonly beneficiary_id?: string | null;
  readonly category?: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: "pending" | "completed" | "cancelled" | "failed";
  readonly reference: string;
  readonly idempotency_key: string;
  readonly created_at: string;
  readonly completed_at?: string | null;
}

export interface FinancialCategoryBudgetDto {
  readonly id: string;
  readonly category: string;
  readonly currency: string;
  readonly period_type: string;
  readonly limit_amount: string;
  readonly used_amount: string;
  readonly available_amount: string;
  readonly approval_threshold?: string | null;
  readonly status: string;
}

export interface FinancialToolMetadataDto {
  readonly id: string;
  readonly version_id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly description_hash: string;
  readonly protocol: "mcp" | "rest" | "a2a";
  readonly risk_tier: "R0" | "R1" | "R2" | "R3" | "R4";
  readonly read_only: boolean;
  readonly protected: boolean;
  readonly reversibility: "reversible" | "compensatable" | "irreversible";
  readonly required_capability: string;
  readonly endpoint_ref: string;
  readonly status: string;
}

export interface FinancialSummaryDto {
  readonly organisation_name: string;
  readonly primary_account: FinancialAccountDto | null;
  readonly total_available_balance: string;
  readonly currency: string;
  readonly unpaid_invoice_count: number;
  readonly unpaid_invoice_value: string;
  readonly monthly_budgets: readonly FinancialCategoryBudgetDto[];
  readonly recent_transactions: readonly FinancialTransactionDto[];
}

export interface TaskRecordDto {
  readonly id: string;
  readonly user_id: string;
  readonly original_request: string;
  readonly objective?: string | null;
  readonly constraints: Record<string, unknown>;
  readonly state: string;
  readonly trace_id?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AgentRegistryDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly active_version?: string | null;
  readonly framework?: string | null;
  readonly artifact_digest?: string | null;
  readonly allowed_tools: readonly string[];
  readonly created_at: string;
}

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function getApiBaseUrl(): string {
  return DEFAULT_API_BASE.replace(/\/+$/, "");
}

export interface ApiResult<T> {
  readonly data: T;
  readonly live: boolean;
  readonly error?: string;
}

export const FALLBACK_ACCOUNT: FinancialAccountDto = {
  id: "66c55779-2142-5317-9f88-1d496747e188",
  organisation_name: "Neolith Demo Corp",
  name: "Operations Account",
  account_type: "operating",
  currency: "INR",
  available_balance: "100000.00",
  status: "active",
  created_at: "2026-10-20T00:00:00Z",
  updated_at: "2026-10-20T00:00:00Z",
};

export const FALLBACK_BENEFICIARIES: readonly BeneficiaryDto[] = [
  {
    id: "c6753205-85a4-5780-9559-7b9247e166a6",
    name: "Acme Cloud",
    reference: "BENE-ACME-001",
    status: "active",
    verified: true,
    created_at: "2026-10-20T00:00:00Z",
  },
  {
    id: "e5398870-5591-5a57-b310-6323793927a7",
    name: "Nova Compute",
    reference: "BENE-NOVA-002",
    status: "active",
    verified: true,
    created_at: "2026-10-20T00:00:00Z",
  },
  {
    id: "89477c86-1536-5082-9842-83539247746d",
    name: "Unknown Supplies",
    reference: "BENE-UNKN-003",
    status: "pending",
    verified: false,
    created_at: "2026-10-20T00:00:00Z",
  },
];

export const FALLBACK_INVOICES: readonly InvoiceDto[] = [
  {
    id: "5d579133-4a91-5995-9333-805232971319",
    invoice_number: "INV-001",
    vendor_name: "Acme Cloud",
    category: "software",
    amount: "8000.00",
    currency: "INR",
    due_date: "2026-11-15",
    status: "unpaid",
    is_verified_vendor: true,
    description: "Monthly enterprise observability & cloud SaaS subscription.",
    created_at: "2026-10-20T00:00:00Z",
    updated_at: "2026-10-20T00:00:00Z",
  },
  {
    id: "1b578842-2277-5241-a217-935721911258",
    invoice_number: "INV-002",
    vendor_name: "Nova Compute",
    category: "infrastructure",
    amount: "35000.00",
    currency: "INR",
    due_date: "2026-11-20",
    status: "unpaid",
    is_verified_vendor: true,
    description: "Dedicated GPU inference cluster & Kubernetes node reservation.",
    created_at: "2026-10-20T00:00:00Z",
    updated_at: "2026-10-20T00:00:00Z",
  },
  {
    id: "7b227193-4027-5728-8822-211028374921",
    invoice_number: "INV-003",
    vendor_name: "Unknown Supplies",
    category: "miscellaneous",
    amount: "75000.00",
    currency: "INR",
    due_date: "2026-11-25",
    status: "unpaid",
    is_verified_vendor: false,
    description: "Unverified ad-hoc hardware procurement invoice exceeding category cap.",
    created_at: "2026-10-20T00:00:00Z",
    updated_at: "2026-10-20T00:00:00Z",
  },
];

export const FALLBACK_BUDGETS: readonly FinancialCategoryBudgetDto[] = [
  {
    id: "b1-infrastructure",
    category: "infrastructure",
    currency: "INR",
    period_type: "month",
    limit_amount: "50000.00",
    used_amount: "0.00",
    available_amount: "50000.00",
    approval_threshold: "25000.00",
    status: "active",
  },
  {
    id: "b2-miscellaneous",
    category: "miscellaneous",
    currency: "INR",
    period_type: "month",
    limit_amount: "10000.00",
    used_amount: "0.00",
    available_amount: "10000.00",
    approval_threshold: "5000.00",
    status: "active",
  },
  {
    id: "b3-software",
    category: "software",
    currency: "INR",
    period_type: "month",
    limit_amount: "25000.00",
    used_amount: "0.00",
    available_amount: "25000.00",
    approval_threshold: "15000.00",
    status: "active",
  },
];

export const FALLBACK_TRANSACTIONS: readonly FinancialTransactionDto[] = [
  {
    id: "a1994827-3321-5192-9281-119283746510",
    transaction_type: "opening_credit",
    account_id: FALLBACK_ACCOUNT.id,
    category: "treasury",
    amount: "100000.00",
    currency: "INR",
    status: "completed",
    reference: "OPENING-BAL-001 — Treasury Allocation for Neolith Demo Corp",
    idempotency_key: "seed:opening-credit:operations",
    created_at: "2026-10-20T00:00:00Z",
    completed_at: "2026-10-20T00:00:00Z",
  },
];

export const FALLBACK_TOOLS: readonly FinancialToolMetadataDto[] = [
  {
    id: "t-get-account-balance",
    version_id: "tv-get-account-balance",
    name: "get_account_balance",
    version: "1.0.0",
    description: "Read-only lookup of synthetic treasury/operating account balance.",
    description_hash: "sha256:read_account",
    protocol: "mcp",
    risk_tier: "R1",
    read_only: true,
    protected: false,
    reversibility: "reversible",
    required_capability: "finance.account.read",
    endpoint_ref: "simulator://financial/get_account_balance",
    status: "active",
  },
  {
    id: "t-list-transactions",
    version_id: "tv-list-transactions",
    name: "list_transactions",
    version: "1.0.0",
    description: "Read-only listing of recent financial transactions.",
    description_hash: "sha256:read_tx",
    protocol: "mcp",
    risk_tier: "R1",
    read_only: true,
    protected: false,
    reversibility: "reversible",
    required_capability: "finance.transaction.read",
    endpoint_ref: "simulator://financial/list_transactions",
    status: "active",
  },
  {
    id: "t-get-invoice",
    version_id: "tv-get-invoice",
    name: "get_invoice",
    version: "1.0.0",
    description: "Read-only lookup of a vendor invoice by invoice number or UUID.",
    description_hash: "sha256:read_inv",
    protocol: "mcp",
    risk_tier: "R1",
    read_only: true,
    protected: false,
    reversibility: "reversible",
    required_capability: "finance.invoice.read",
    endpoint_ref: "simulator://financial/get_invoice",
    status: "active",
  },
  {
    id: "t-get-budget-status",
    version_id: "tv-get-budget-status",
    name: "get_budget_status",
    version: "1.0.0",
    description: "Read-only lookup of monthly category budget limits and available funds.",
    description_hash: "sha256:read_budget",
    protocol: "mcp",
    risk_tier: "R1",
    read_only: true,
    protected: false,
    reversibility: "reversible",
    required_capability: "finance.budget.read",
    endpoint_ref: "simulator://financial/get_budget_status",
    status: "active",
  },
  {
    id: "t-get-beneficiary",
    version_id: "tv-get-beneficiary",
    name: "get_beneficiary",
    version: "1.0.0",
    description: "Read-only lookup of beneficiary verification status.",
    description_hash: "sha256:read_bene",
    protocol: "mcp",
    risk_tier: "R1",
    read_only: true,
    protected: false,
    reversibility: "reversible",
    required_capability: "finance.beneficiary.read",
    endpoint_ref: "simulator://financial/get_beneficiary",
    status: "active",
  },
  {
    id: "t-pay-invoice",
    version_id: "tv-pay-invoice",
    name: "pay_invoice",
    version: "1.0.0",
    description: "Protected write tool that settles an unpaid vendor invoice (requires Runtime Gateway permit).",
    description_hash: "sha256:write_pay",
    protocol: "mcp",
    risk_tier: "R2",
    read_only: false,
    protected: true,
    reversibility: "compensatable",
    required_capability: "finance.invoice.pay",
    endpoint_ref: "simulator://financial/pay_invoice",
    status: "active",
  },
  {
    id: "t-transfer-funds",
    version_id: "tv-transfer-funds",
    name: "transfer_funds",
    version: "1.0.0",
    description: "Protected write tool that transfers funds to a beneficiary (requires Runtime Gateway permit).",
    description_hash: "sha256:write_transfer",
    protocol: "mcp",
    risk_tier: "R3",
    read_only: false,
    protected: true,
    reversibility: "irreversible",
    required_capability: "finance.funds.transfer",
    endpoint_ref: "simulator://financial/transfer_funds",
    status: "active",
  },
  {
    id: "t-add-beneficiary",
    version_id: "tv-add-beneficiary",
    name: "add_beneficiary",
    version: "1.0.0",
    description: "Protected write tool that registers a new external payment beneficiary (requires Runtime Gateway permit).",
    description_hash: "sha256:write_bene",
    protocol: "mcp",
    risk_tier: "R4",
    read_only: false,
    protected: true,
    reversibility: "reversible",
    required_capability: "finance.beneficiary.manage",
    endpoint_ref: "simulator://financial/add_beneficiary",
    status: "active",
  },
  {
    id: "t-cancel-payment",
    version_id: "tv-cancel-payment",
    name: "cancel_payment",
    version: "1.0.0",
    description: "Protected write tool that cancels or compensates a pending payment (requires Runtime Gateway permit).",
    description_hash: "sha256:write_cancel",
    protocol: "mcp",
    risk_tier: "R2",
    read_only: false,
    protected: true,
    reversibility: "reversible",
    required_capability: "finance.payment.cancel",
    endpoint_ref: "simulator://financial/cancel_payment",
    status: "active",
  },
];

export const FALLBACK_SUMMARY: FinancialSummaryDto = {
  organisation_name: "Neolith Demo Corp",
  primary_account: FALLBACK_ACCOUNT,
  total_available_balance: "100000.00",
  currency: "INR",
  unpaid_invoice_count: 3,
  unpaid_invoice_value: "118000.00",
  monthly_budgets: FALLBACK_BUDGETS,
  recent_transactions: FALLBACK_TRANSACTIONS,
};

export const FALLBACK_TASKS: readonly TaskRecordDto[] = [
  {
    id: "3a918273-4412-5918-8812-991827364512",
    user_id: "11111111-2222-3333-4444-555555555555",
    original_request:
      "Inspect unpaid vendor invoices (INV-001, INV-002, INV-003) against Neolith Demo Corp monthly category budgets and verify vendor status.",
    objective:
      "Evaluate accounts payable readiness under policy and budget guardrails.",
    constraints: { currency: "INR", require_verified_vendor: true },
    state: "planning",
    trace_id: "trace-seed-demo-001",
    created_at: "2026-10-20T00:00:00Z",
    updated_at: "2026-10-20T00:00:00Z",
  },
];

export const FALLBACK_AGENTS: readonly AgentRegistryDto[] = [
  {
    id: "99182736-1122-5344-9988-776655443322",
    name: "financial-ai-agent",
    description:
      "Autonomous Financial Operations & Accounts Payable AI Agent for Neolith Demo Corp. Operates under strict Runtime Gateway governance.",
    status: "active",
    active_version: "0.1.0",
    framework: "langgraph",
    artifact_digest:
      "8c9e442f01928374651928374651928374651928374651928374651928374651",
    allowed_tools: FALLBACK_TOOLS.map((t) => t.name),
    created_at: "2026-10-20T00:00:00Z",
  },
];

export async function fetchApiWithFallback<T>(
  path: string,
  fallback: T
): Promise<ApiResult<T>> {
  const url = `${getApiBaseUrl()}${path}`;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return {
        data: fallback,
        live: false,
        error: `API returned HTTP ${response.status} for ${path}`,
      };
    }
    const parsed = (await response.json()) as T;
    return { data: parsed, live: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Backend API unreachable";
    return { data: fallback, live: false, error: message };
  }
}
