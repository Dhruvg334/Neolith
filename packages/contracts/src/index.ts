/**
 * Canonical contract descriptors and TypeScript interfaces aligned with:
 * - specs/openapi.yaml
 * - specs/schemas/*.schema.json
 */

export const CONTRACT_SCHEMA_IDS = {
  decisionReceipt: "https://neolith.local/schemas/decision-receipt.schema.json",
  executionPermit: "https://neolith.local/schemas/execution-permit.schema.json",
  executionRequest: "https://neolith.local/schemas/execution-request.schema.json",
  policyInput: "https://neolith.local/schemas/policy-input.schema.json",
  task: "https://neolith.local/schemas/task.schema.json",
} as const;

export type TaskState =
  | "draft"
  | "understanding"
  | "needs_clarification"
  | "researching"
  | "planning"
  | "awaiting_governance"
  | "awaiting_approval"
  | "ready_to_execute"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "denied"
  | "execution_pending_reconciliation";

export type DecisionOutcome =
  | "allow"
  | "deny"
  | "review"
  | "allow_with_constraints";

export interface HealthResponse {
  readonly status: "ok";
  readonly service: string;
  readonly version: string;
}

export interface DependencyStatus {
  readonly status: "ok" | "error";
  readonly detail?: string | null;
}

export interface ReadinessResponse {
  readonly status: "ready" | "degraded";
  readonly service: string;
  readonly version: string;
  readonly dependencies: {
    readonly postgres: DependencyStatus;
    readonly redis: DependencyStatus;
    readonly opa: DependencyStatus;
  };
}

export interface ProblemDetail {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly reason_code?: string;
  readonly trace_id?: string;
}

export interface TaskContract {
  readonly task_id: string;
  readonly user_id: string;
  readonly request: string;
  readonly objective?: string | null;
  readonly constraints?: Record<string, unknown>;
  readonly state: TaskState;
  readonly trace_id?: string | null;
  readonly created_at: string;
  readonly updated_at?: string | null;
}

export interface ExecutionRequestEnvelope {
  readonly action_id: string;
  readonly trace_id: string;
  readonly task_id: string;
  readonly user_id: string;
  readonly agent_id: string;
  readonly agent_version: string;
  readonly delegation_id?: string | null;
  readonly tool_id: string;
  readonly tool_version?: string;
  readonly operation: string;
  readonly resource?: string | null;
  readonly category?: string | null;
  readonly amount?: string | null;
  readonly currency?: string | null;
  readonly parameters: Record<string, unknown>;
  readonly parameters_hash: string;
  readonly context?: Record<string, unknown>;
  readonly context_hash: string;
  readonly requested_at: string;
  readonly nonce: string;
}
