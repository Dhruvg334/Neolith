export interface ReasonCodeListProps {
  readonly codes: readonly string[];
}

export const REASON_CODE_EXPLANATIONS: Readonly<Record<string, string>> = {
  BASE_POLICY_ALLOW:
    "Action satisfies all active organisational policy constraints and budget limits.",
  DEFAULT_DENY:
    "Protected actions are denied by default until deterministic policy rules explicitly allow them.",
  EMERGENCY_STOP_ACTIVE:
    "Global system emergency stop is active; all protected execution requests and permits are blocked.",
  AGENT_INACTIVE:
    "Requesting agent version is inactive, suspended, or quarantined in the workload registry.",
  PERMISSION_MISSING:
    "Subject or agent version lacks the required capability binding for this operation.",
  TOOL_NOT_ALLOWED:
    "Requested tool is not allowlisted for the active agent version or task scope.",
  POLICY_CATEGORY_DENIED:
    "Requested action category is explicitly blocked by organisational or task policy.",
  BUDGET_EXCEEDED:
    "Requested spend exceeds the remaining available budget for the applicable period.",
  APPROVAL_THRESHOLD_REACHED:
    "Requested amount meets or exceeds the human approval threshold configured on the budget.",
  OBJECTIVE_MISMATCH:
    "Proposed action parameters diverge significantly from the user's stated task objective.",
  OBJECTIVE_ALIGNMENT_UNCERTAIN:
    "Semantic alignment confidence requires human review before permit issuance.",
  PERMIT_REPLAY:
    "Single-use execution permit nonce has already been consumed and cannot be replayed.",
  PARAMETER_HASH_MISMATCH:
    "Action parameters at execution time do not match the canonical SHA-256 hash bound to the permit.",
  REVOCATION_EPOCH_MISMATCH:
    "Permit revocation epoch is older than the current authoritative system revocation epoch.",
};

export function ReasonCodeList({ codes }: ReasonCodeListProps) {
  if (codes.length === 0) {
    return null;
  }

  return (
    <ul className="ui-reason-list" aria-label="Governance reason codes">
      {codes.map((code) => (
        <li key={code} className="ui-reason-item">
          <code className="inline-code">{code}</code>
          <span className="card-copy">
            {REASON_CODE_EXPLANATIONS[code] ??
              "Deterministic governance reason code recorded on decision."}
          </span>
        </li>
      ))}
    </ul>
  );
}
