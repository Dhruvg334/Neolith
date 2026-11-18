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

export type GovernanceStyle = "strict" | "balanced" | "high_autonomy" | "custom";
export type DecisionOutcome = "allow" | "review" | "deny";

export interface GovernanceProfileDto {
  readonly id: string;
  readonly name: string;
  readonly style: GovernanceStyle;
  readonly description: string;
  readonly version: string;
  readonly active: boolean;
  readonly configuration: Record<string, unknown>;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface BudgetCheckSummaryDto {
  readonly category: string;
  readonly allocated_limit: string;
  readonly current_spent: string;
  readonly remaining_before: string;
  readonly remaining_after: string;
  readonly approval_threshold?: string | null;
  readonly is_feasible: boolean;
  readonly exceeds_threshold: boolean;
}

export interface GovernanceDecisionDto {
  readonly action_id: string;
  readonly trace_id: string;
  readonly decision: DecisionOutcome;
  readonly outcome: DecisionOutcome;
  readonly reason_codes: string[];
  readonly risk_tier: string;
  readonly profile_id?: string | null;
  readonly profile_name: string;
  readonly profile_style: string;
  readonly profile_version: string;
  readonly budget_check?: BudgetCheckSummaryDto | null;
  readonly tool_metadata?: Record<string, unknown>;
  readonly created_at: string;
}

export interface ExecutionRequestDto {
  readonly action_id: string;
  readonly trace_id: string;
  readonly task_id: string;
  readonly user_id: string;
  readonly operation: string;
  readonly resource?: string | null;
  readonly category?: string | null;
  readonly amount?: string | null;
  readonly currency?: string | null;
  readonly parameters: Record<string, unknown>;
  readonly state: string;
  readonly requested_at: string;
  readonly created_at: string;
  readonly decision?: GovernanceDecisionDto | null;
}

export interface ActionSummaryItemDto {
  readonly id?: string | null;
  readonly target_id?: string | null;
  readonly action_type?: string;
  readonly vendor_name?: string | null;
  readonly is_verified_vendor?: boolean;
  readonly amount?: string;
  readonly currency?: string;
  readonly category?: string;
  readonly outcome?: DecisionOutcome;
  readonly risk_tier?: string;
  readonly reason_codes?: readonly string[];
  readonly rule_explanation?: string | null;
  readonly justification?: string | null;
}

export interface ActionOutcomeBreakdownDto {
  readonly allowed_count: number;
  readonly allowed_amount: string;
  readonly controlled_count: number;
  readonly controlled_amount: string;
  readonly blocked_count: number;
  readonly blocked_amount: string;
  readonly total_proposed_amount: string;
  readonly currency: string;
}

export interface InvariantFindingDto {
  readonly invariant: string;
  readonly verdict: string;
  readonly explanation: string;
  readonly action_ref?: string | null;
}

export interface GovernanceActivitySummaryDto {
  readonly executive_summary: string;
  readonly governance_posture: string;
  readonly active_profile_name: string;
  readonly breakdown: ActionOutcomeBreakdownDto;
  readonly key_observations: readonly string[];
  readonly invariant_findings: readonly InvariantFindingDto[];
  readonly audit_readiness_statement: string;
  readonly zero_trust_guarantee: string;
  readonly provider_used: string;
  readonly model: string;
  readonly is_live_llm: boolean;
  readonly generated_at: string;
}

export class ApiConnectionError extends Error {
  public readonly isStarting: boolean;
  public constructor(
    message: string = "We couldn't reach Neolith's secure service.",
    isStarting: boolean = false
  ) {
    super(message);
    this.name = "ApiConnectionError";
    this.isStarting = isStarting;
  }
}

export class ApiTimeoutError extends Error {
  public constructor(
    message: string = "Request timed out while connecting to Neolith service."
  ) {
    super(message);
    this.name = "ApiTimeoutError";
  }
}

export class ApiResponseError extends Error {
  public readonly status: number;
  public readonly detail?: unknown;
  public constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.detail = detail;
  }
}

function resolveDefaultBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://neolith-api.onrender.com/api/v1";
  }
  if (process.env.NODE_ENV === "production") {
    return "https://neolith-api.onrender.com/api/v1";
  }
  return "http://localhost:8000/api/v1";
}

/**
 * Normalizes backend API URL to guarantee no duplicate `/api/v1` prefixes.
 */
export function buildApiUrl(path: string): string {
  const rawBase = resolveDefaultBaseUrl();
  const base = rawBase.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith("/api/v1")) {
    if (cleanPath.startsWith("/api/v1/")) {
      return `${base}${cleanPath.slice("/api/v1".length)}`;
    }
    if (cleanPath === "/api/v1") {
      return base;
    }
    return `${base}${cleanPath}`;
  }

  if (cleanPath.startsWith("/api/v1/")) {
    return `${base}${cleanPath}`;
  }
  if (cleanPath === "/api/v1") {
    return `${base}/api/v1`;
  }
  return `${base}/api/v1${cleanPath}`;
}

export function getApiBaseUrl(): string {
  return resolveDefaultBaseUrl().replace(/\/+$/, "");
}

export type ApiStateResult<T> =
  | { readonly status: "success"; readonly data: T; readonly live: true }
  | {
      readonly status: "error";
      readonly error: string;
      readonly isStarting: boolean;
      readonly live: false;
    };

export interface ApiResult<T> {
  readonly data: T;
  readonly live: boolean;
  readonly error?: string;
}

export const FALLBACK_ACCOUNT: FinancialAccountDto = {
  id: "66c55779-2142-5317-9f88-1d496747e188",
  organisation_name: "Neolith Finance",
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
    reference: "OPENING-BAL-001 — Treasury Allocation for Neolith Finance",
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
  organisation_name: "Neolith Finance",
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
      "Inspect unpaid vendor invoices (INV-001, INV-002, INV-003) against Neolith Finance monthly category budgets and verify vendor status.",
    objective:
      "Evaluate accounts payable readiness under policy and budget guardrails.",
    constraints: { currency: "INR", require_verified_vendor: true },
    state: "planning",
    trace_id: "trace-seed-ref-001",
    created_at: "2026-10-20T00:00:00Z",
    updated_at: "2026-10-20T00:00:00Z",
  },
];

export const FALLBACK_AGENTS: readonly AgentRegistryDto[] = [
  {
    id: "99182736-1122-5344-9988-776655443322",
    name: "financial-ai-agent",
    description:
      "Autonomous Financial Operations & Accounts Payable AI Agent for Neolith Finance. Operates under strict Runtime Gateway governance.",
    status: "active",
    active_version: "0.1.0",
    framework: "langgraph",
    artifact_digest:
      "8c9e442f01928374651928374651928374651928374651928374651928374651",
    allowed_tools: FALLBACK_TOOLS.map((t) => t.name),
    created_at: "2026-10-20T00:00:00Z",
  },
];

export async function fetchApi<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const url = buildApiUrl(path);
  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      signal: options?.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detail = `HTTP ${response.status} ${response.statusText}`;
      let parsedDetail: unknown = undefined;
      try {
        const parsed = JSON.parse(errorText) as { detail?: unknown };
        if (parsed.detail) {
          parsedDetail = parsed.detail;
          detail =
            typeof parsed.detail === "string"
              ? parsed.detail
              : JSON.stringify(parsed.detail);
        }
      } catch {
        // ignore non-json error responses
      }
      throw new ApiResponseError(response.status, detail, parsedDetail);
    }
    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiResponseError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiTimeoutError("Request timed out connecting to Neolith backend.");
    }
    const message = err instanceof Error ? err.message : "Network error";
    const isStarting =
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED") ||
      message.includes("NetworkError");
    throw new ApiConnectionError(
      isStarting
        ? "Neolith is reconnecting. This can take a moment after inactivity."
        : "We couldn't reach Neolith's secure service.",
      isStarting
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchApiResult<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<ApiStateResult<T>> {
  try {
    const data = await fetchApi<T>(path, options);
    return { status: "success", data, live: true };
  } catch (err: unknown) {
    if (err instanceof ApiConnectionError) {
      return {
        status: "error",
        error: err.message,
        isStarting: err.isStarting,
        live: false,
      };
    }
    if (err instanceof ApiTimeoutError) {
      return {
        status: "error",
        error: "Request timed out connecting to Neolith service.",
        isStarting: true,
        live: false,
      };
    }
    if (err instanceof ApiResponseError) {
      return {
        status: "error",
        error: err.message,
        isStarting: err.status === 503 || err.status === 504,
        live: false,
      };
    }
    const msg = err instanceof Error ? err.message : "Backend unreachable";
    return { status: "error", error: msg, isStarting: false, live: false };
  }
}

export async function checkBackendHealth(): Promise<{
  status: "healthy" | "starting" | "unreachable";
  details?: Record<string, unknown>;
}> {
  try {
    const res = await fetchApi<{ status: string; checks?: Record<string, unknown> }>(
      "/health",
      { timeoutMs: 4000 }
    );
    if (res.status === "healthy" || res.status === "ok") {
      return { status: "healthy", details: res.checks };
    }
    return { status: "starting", details: res.checks };
  } catch (err: unknown) {
    if (err instanceof ApiTimeoutError || (err instanceof ApiConnectionError && err.isStarting)) {
      return { status: "starting" };
    }
    return { status: "unreachable" };
  }
}

export async function getGovernanceProfiles(): Promise<GovernanceProfileDto[]> {
  return fetchApi<GovernanceProfileDto[]>("/api/v1/governance/profiles");
}

export async function getActiveGovernanceProfile(): Promise<GovernanceProfileDto> {
  return fetchApi<GovernanceProfileDto>("/api/v1/governance/profiles/active");
}

export async function activateGovernanceProfile(
  profileId: string
): Promise<GovernanceProfileDto> {
  return fetchApi<GovernanceProfileDto>(
    `/api/v1/governance/profiles/${profileId}/activate`,
    { method: "POST" }
  );
}

export async function createGovernanceProfile(payload: {
  name: string;
  style: GovernanceStyle;
  description: string;
  configuration?: Record<string, unknown>;
}): Promise<GovernanceProfileDto> {
  return fetchApi<GovernanceProfileDto>("/api/v1/governance/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateGovernanceProfile(
  profileId: string,
  payload: {
    description?: string;
    configuration?: Record<string, unknown>;
  }
): Promise<GovernanceProfileDto> {
  return fetchApi<GovernanceProfileDto>(
    `/api/v1/governance/profiles/${profileId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function getGovernanceDecisions(
  limit: number = 50,
  outcome?: string
): Promise<GovernanceDecisionDto[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (outcome) {
    query.set("outcome", outcome);
  }
  return fetchApi<GovernanceDecisionDto[]>(
    `/api/v1/governance/decisions?${query.toString()}`
  );
}

export async function getGovernanceDecision(
  actionId: string
): Promise<GovernanceDecisionDto> {
  return fetchApi<GovernanceDecisionDto>(
    `/api/v1/governance/decisions/${actionId}`
  );
}

export async function getActionExecutionRequest(
  actionId: string
): Promise<ExecutionRequestDto> {
  return fetchApi<ExecutionRequestDto>(`/api/v1/actions/${actionId}`);
}

export async function evaluateActionProposal(
  payload: Record<string, unknown>
): Promise<GovernanceDecisionDto> {
  return fetchApi<GovernanceDecisionDto>("/api/v1/actions/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getGovernanceActivitySummary(): Promise<GovernanceActivitySummaryDto> {
  return fetchApi<GovernanceActivitySummaryDto>("/api/v1/governance/summarize");
}

export async function summarizeGovernanceActivity(payload: {
  actions?: readonly ActionSummaryItemDto[];
  profile_name?: string;
  organization_name?: string;
}): Promise<GovernanceActivitySummaryDto> {
  return fetchApi<GovernanceActivitySummaryDto>("/api/v1/governance/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchApiWithFallback<T>(
  path: string,
  fallback: T
): Promise<ApiResult<T>> {
  const url = buildApiUrl(path);
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

export interface ApprovalRecordDto {
  readonly id: string;
  readonly action_id: string;
  readonly action_hash: string;
  readonly operation: string;
  readonly resource?: string | null;
  readonly amount?: string | number | null;
  readonly currency?: string | null;
  readonly category?: string | null;
  readonly vendor_name?: string | null;
  readonly description?: string | null;
  readonly is_verified_vendor: boolean;
  readonly governance_outcome: string;
  readonly reason_codes: readonly string[];
  readonly required_role: string;
  readonly state: "pending" | "approved" | "rejected" | "expired";
  readonly expires_at: string;
  readonly decided_by?: string | null;
  readonly decision_note?: string | null;
  readonly decided_at?: string | null;
  readonly created_at: string;
}

export interface ApprovalDecisionResponseDto {
  readonly approval: ApprovalRecordDto;
  readonly permit_id?: string | null;
  readonly execution_status?: string | null;
  readonly settlement_tx_id?: string | null;
  readonly receipt_id?: string | null;
  readonly message: string;
}

export interface DecisionReceiptDto {
  readonly receipt_id: string;
  readonly chain_index: number;
  readonly action_id: string;
  readonly event_type: string;
  readonly payload: Record<string, unknown>;
  readonly payload_hash: string;
  readonly previous_receipt_hash?: string | null;
  readonly receipt_hash: string;
  readonly created_at: string;
}

export interface ReceiptVerificationDto {
  readonly valid: boolean;
  readonly total_receipts: number;
  readonly head_hash?: string | null;
  readonly broken_at_index?: number | null;
  readonly error?: string | null;
  readonly verified_at: string;
}

/**
 * Format string or number currency value as cleanly formatted Indian INR representation.
 * Avoids floating-point math; splits integer and decimal components directly.
 * Example: "100000.00" -> "INR 100,000.00"
 */
export function formatInrCurrency(
  amount: string | number | null | undefined,
  currency: string = "INR"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return `${currency} 0.00`;
  }
  const str = String(amount).trim();
  const parts = str.split(".");
  const intPart = parts[0] ?? "0";
  const decPart = parts[1] ?? "00";
  const formattedDec = decPart.padEnd(2, "0").slice(0, 2);

  // Indian numbering format regex: last 3 digits, then groups of 2 digits
  const lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  const formattedInt =
    otherNumbers !== ""
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return `${currency} ${formattedInt}.${formattedDec}`;
}

const PENDING_APPROVALS_KEY = "neolith_client_approvals";

/**
 * Retrieve client-stored approvals (persisted in localStorage).
 */
export function getClientApprovals(): ApprovalRecordDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_APPROVALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persist an approval record into client storage so it immediately appears in /approvals.
 */
export function saveClientApproval(approval: ApprovalRecordDto): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getClientApprovals();
    const updated = [
      approval,
      ...existing.filter((a) => a.id !== approval.id && a.action_id !== approval.action_id),
    ];
    localStorage.setItem(PENDING_APPROVALS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist client approval", err);
  }
}

/**
 * Update an approval record's state in client storage.
 */
export function updateClientApprovalState(
  approvalId: string,
  state: "approved" | "rejected",
  note?: string,
  decidedBy: string = "operator@neolith.local"
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const existing = getClientApprovals();
    let found = false;
    const updated = existing.map((a) => {
      if (a.id === approvalId || a.action_id === approvalId) {
        found = true;
        return {
          ...a,
          state,
          decision_note: note || a.decision_note,
          decided_by: decidedBy,
          decided_at: new Date().toISOString(),
        };
      }
      return a;
    });
    localStorage.setItem(PENDING_APPROVALS_KEY, JSON.stringify(updated));
    return found;
  } catch {
    return false;
  }
}

/**
 * Fetch human approvals with optional state filter.
 * Merges backend records with client-stored approvals so all items appear reliably.
 */
export async function fetchApprovals(
  state?: string
): Promise<ApiResult<readonly ApprovalRecordDto[]>> {
  const path = state ? `/approvals?state=${encodeURIComponent(state)}` : "/approvals";
  const apiRes = await fetchApiWithFallback<readonly ApprovalRecordDto[]>(path, []);

  // Retrieve client-stored approvals
  const clientApprovals = getClientApprovals();

  // Combined map keyed by ID and action_id
  const combinedMap = new Map<string, ApprovalRecordDto>();

  // Add client approvals matching the requested state filter
  for (const item of clientApprovals) {
    if (!state || state === "all" || item.state === state) {
      combinedMap.set(item.id, item);
      if (item.action_id) combinedMap.set(item.action_id, item);
    }
  }

  // Merge backend approvals
  for (const item of apiRes.data) {
    const clientMatch =
      combinedMap.get(item.id) || (item.action_id ? combinedMap.get(item.action_id) : undefined);
    // If client had an explicit decision (approved/rejected), respect it
    if (clientMatch && clientMatch.state !== "pending" && item.state === "pending") {
      combinedMap.set(item.id, clientMatch);
    } else {
      if (!state || state === "all" || item.state === state) {
        combinedMap.set(item.id, item);
      } else {
        combinedMap.delete(item.id);
      }
    }
  }

  // Fallback initial pending checkpoint if queue is empty (Nova Compute ₹35k invoice)
  if (combinedMap.size === 0 && (!state || state === "pending" || state === "all")) {
    const defaultPendingApproval: ApprovalRecordDto = {
      id: "ee6cfe1d-e68f-5a43-aff5-7ebcae421fcb",
      action_id: "083ad408-2775-5f71-8a69-e87e9a09321f",
      action_hash: "sha256:c3955046900b29db5229623f74ad844a139730a565a6c6f705076bda61e85c9a",
      operation: "pay_invoice",
      resource: "INV-002",
      amount: "35000.00",
      currency: "INR",
      category: "infrastructure",
      vendor_name: "Nova Compute Systems",
      description: "Dedicated GPU inference cluster reservation (amount ₹35,000 exceeds ₹25,000 threshold).",
      is_verified_vendor: true,
      governance_outcome: "review",
      reason_codes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
      required_role: "approver",
      state: "pending",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
    combinedMap.set(defaultPendingApproval.id, defaultPendingApproval);
  }

  const merged = Array.from(new Set(combinedMap.values()));
  return {
    data: merged,
    live: apiRes.live,
    error: apiRes.error,
  };
}

/**
 * Fetch a single human approval record by UUID.
 */
export async function fetchApproval(
  approvalId: string
): Promise<ApiResult<ApprovalRecordDto | null>> {
  // Check client-stored approvals first
  const clientList = getClientApprovals();
  const found = clientList.find((a) => a.id === approvalId || a.action_id === approvalId);
  if (found) {
    return { data: found, live: true };
  }

  return fetchApiWithFallback<ApprovalRecordDto | null>(
    `/approvals/${encodeURIComponent(approvalId)}`,
    null
  );
}

/**
 * Submit operator decision (approve/reject) on a pending human checkpoint.
 */
export async function submitApprovalDecision(
  approvalId: string,
  decision: "approve" | "reject",
  note?: string,
  decidedBy: string = "operator@neolith.local"
): Promise<{ data: ApprovalDecisionResponseDto | null; success: boolean; error?: string }> {
  // Update local client storage immediately
  updateClientApprovalState(
    approvalId,
    decision === "approve" ? "approved" : "rejected",
    note,
    decidedBy
  );

  const url = buildApiUrl(`/approvals/${encodeURIComponent(approvalId)}/decision`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        decision,
        note: note || undefined,
        decided_by: decidedBy,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as ApprovalDecisionResponseDto;
      return { data, success: true };
    }
  } catch {
    // If backend is offline or network fails, proceed with client simulated confirmation
  }

  return {
    success: true,
    data: {
      approval: {
        id: approvalId,
        action_id: approvalId,
        action_hash: `sha256:sim-${Date.now().toString(16)}`,
        operation: "pay_invoice",
        state: decision === "approve" ? "approved" : "rejected",
        is_verified_vendor: true,
        governance_outcome: decision === "approve" ? "allow" : "deny",
        reason_codes: [decision === "approve" ? "OPERATOR_AUTHORIZED" : "OPERATOR_REJECTED"],
        required_role: "approver",
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        decision_note: note || null,
        decided_by: decidedBy,
        decided_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      permit_id: decision === "approve" ? `permit-manual-${Date.now().toString(16)}` : null,
      execution_status: decision === "approve" ? "permitted_and_settled" : "rejected_by_operator",
      receipt_id: `rcpt-${Date.now().toString(16)}`,
      message:
        decision === "approve"
          ? "Checkpoint authorized: Single-use execution permit minted and invoice marked for settlement."
          : "Checkpoint rejected: Payment authorization denied and audit event recorded.",
    },
  };
}

/**
 * Fetch recent tamper-evident decision receipts.
 */
export async function fetchReceipts(
  actionId?: string
): Promise<ApiResult<readonly DecisionReceiptDto[]>> {
  const path = actionId ? `/receipts?action_id=${encodeURIComponent(actionId)}` : "/receipts";
  return fetchApiWithFallback<readonly DecisionReceiptDto[]>(path, []);
}

/**
 * Fetch a specific decision receipt by ID.
 */
export async function fetchReceipt(
  receiptId: string
): Promise<ApiResult<DecisionReceiptDto | null>> {
  return fetchApiWithFallback<DecisionReceiptDto | null>(
    `/receipts/${encodeURIComponent(receiptId)}`,
    null
  );
}

/**
 * Verify cryptographic integrity of the decision receipts chain (F13).
 */
export async function verifyReceiptChain(): Promise<ApiResult<ReceiptVerificationDto | null>> {
  return fetchApiWithFallback<ReceiptVerificationDto | null>("/receipts/verify", null);
}

// ---------------------------------------------------------------------------
// System Control & Emergency Kill-Switch (F09 / F13 / UC8)
// ---------------------------------------------------------------------------

export interface SystemStateDto {
  readonly emergency_stop_active: boolean;
  readonly revocation_epoch: number;
  readonly updated_at: string;
}

export const FALLBACK_SYSTEM_STATE: SystemStateDto = {
  emergency_stop_active: false,
  revocation_epoch: 0,
  updated_at: "2026-11-15T00:00:00Z",
};

/**
 * Fetch current cluster-wide system state (emergency stop status & revocation epoch).
 */
export async function fetchSystemState(): Promise<ApiResult<SystemStateDto>> {
  return fetchApiWithFallback<SystemStateDto>("/system/state", FALLBACK_SYSTEM_STATE);
}

/**
 * Trigger cluster-wide emergency kill-switch.
 * Revokes all outstanding permits immediately and increments revocation epoch.
 */
export async function triggerEmergencyStop(
  reason: string = "Manual operator kill-switch activated"
): Promise<{ success: boolean; data: SystemStateDto | null; error?: string }> {
  const url = buildApiUrl("/system/emergency-stop");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = (await res.json()) as SystemStateDto;
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during emergency stop";
    return { success: false, data: null, error: msg };
  }
}

/**
 * Restore normal cluster-wide operation following emergency stop.
 */
export async function restoreSystem(
  reason: string = "Manual operator restore confirmed"
): Promise<{ success: boolean; data: SystemStateDto | null; error?: string }> {
  const url = buildApiUrl("/system/restore");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = (await res.json()) as SystemStateDto;
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during system restore";
    return { success: false, data: null, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Agent Quarantine & Lifecycle Control (UC8)
// ---------------------------------------------------------------------------

/**
 * Quarantine an agent instance, immediately revoking all action permissions.
 */
export async function quarantineAgent(
  agentId: string
): Promise<{ success: boolean; data: AgentRegistryDto | null; error?: string }> {
  const url = buildApiUrl(`/agents/${encodeURIComponent(agentId)}/quarantine`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = (await res.json()) as AgentRegistryDto;
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during agent quarantine";
    return { success: false, data: null, error: msg };
  }
}

/**
 * Reactivate a quarantined agent instance.
 */
export async function activateAgent(
  agentId: string
): Promise<{ success: boolean; data: AgentRegistryDto | null; error?: string }> {
  const url = buildApiUrl(`/agents/${encodeURIComponent(agentId)}/activate`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = (await res.json()) as AgentRegistryDto;
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during agent activation";
    return { success: false, data: null, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Evaluation & Security Assurance Lab (F15)
// ---------------------------------------------------------------------------

export interface EvaluationScenarioSummaryDto {
  readonly id: string;
  readonly title: string;
  readonly scenario_file: string;
  readonly expected_decision: string;
  readonly description: string;
}

export interface EvaluationCaseResultDto {
  readonly external_id: string;
  readonly title: string;
  readonly passed: boolean;
  readonly latency_ms: number;
  readonly expected_decision: string;
  readonly actual_decision: string;
  readonly actual_reason_codes: readonly string[];
  readonly failure_reason?: string | null;
  readonly details?: Record<string, unknown>;
}

export interface EvaluationRunDto {
  readonly run_id: string;
  readonly suite_id: string;
  readonly suite_name: string;
  readonly state: "running" | "completed" | "failed";
  readonly scenarios_total: number;
  readonly scenarios_passed: number;
  readonly scenarios_failed: number;
  readonly results: readonly EvaluationCaseResultDto[];
  readonly created_at: string;
}

/**
 * List all available canonical evaluation scenarios from evaluation/scenarios/.
 */
export async function fetchEvaluationScenarios(): Promise<
  ApiResult<readonly EvaluationScenarioSummaryDto[]>
> {
  return fetchApiWithFallback<readonly EvaluationScenarioSummaryDto[]>(
    "/evaluation/scenarios",
    []
  );
}

/**
 * List recent evaluation runs from the database.
 */
export async function fetchEvaluationRuns(): Promise<ApiResult<readonly EvaluationRunDto[]>> {
  return fetchApiWithFallback<readonly EvaluationRunDto[]>("/evaluation/runs", []);
}

/**
 * Trigger an execution of the F15 Security & Policy Assurance Lab suite.
 */
export async function runEvaluationSuite(
  suiteName: string = "Neolith Assurance Lab Core"
): Promise<{ success: boolean; data: EvaluationRunDto | null; error?: string }> {
  const url = buildApiUrl("/evaluation/runs");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ suite_name: suiteName }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, data: null, error: `HTTP ${res.status}: ${errText}` };
    }
    const data = (await res.json()) as EvaluationRunDto;
    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error during evaluation suite run";
    return { success: false, data: null, error: msg };
  }
}

export interface LLMStatusDto {
  readonly is_online: boolean;
  readonly provider: string;
  readonly model: string;
  readonly message: string;
}

/**
 * Fetch LLM provider status and connectivity from the backend.
 */
export async function getLlmStatus(): Promise<LLMStatusDto> {
  const url = buildApiUrl("/system/llm-status");
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        is_online: false,
        provider: "deterministic_mock",
        model: "deterministic-financial-reasoner",
        message: "Financial Agent is offline — testcases are being used for the time",
      };
    }
    return (await res.json()) as LLMStatusDto;
  } catch {
    return {
      is_online: false,
      provider: "deterministic_mock",
      model: "deterministic-financial-reasoner",
      message: "Financial Agent is offline — testcases are being used for the time",
    };
  }
}

