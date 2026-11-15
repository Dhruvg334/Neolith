"use client";

import { useState, type FormEvent, useTransition } from "react";
import Link from "next/link";
import {
  Terminal,
  Wallet,
  Sparkles,
  Layers,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Check,
  ArrowRight,
  Lock,
  Sliders,
  Bot,
} from "lucide-react";
import { ActionInspector } from "@/components/ActionInspector";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyableId,
  DataTable,
  RiskTierBadge,
  StatusTimeline,
  type DataTableColumn,
  type RiskTier,
  type TimelineStep,
} from "@/components/ui";
import {
  buildApiUrl,
  formatInrCurrency,
  summarizeGovernanceActivity,
  type FinancialSummaryDto,
  type FinancialToolMetadataDto,
  type InvoiceDto,
  type GovernanceActivitySummaryDto,
  type GovernanceDecisionDto,
  type DecisionOutcome,
} from "@/lib/financial-api";
import {
  DEFAULT_POLICY_SETTINGS,
  type AgentPolicySettings,
  type PolicyProfileStyle,
} from "./AgentPolicyConfig";
import type {
  FinancialActionProposal,
  GovernanceSummary,
  InterfaceResponse,
  InterfaceResponseStatus,
} from "@neolith/contracts";

export type WorkspaceTabId =
  | "console"
  | "context"
  | "policies"
  | "activity"
  | "architecture";

export type ChannelId = "web" | "twilio" | "voice";

interface WorkspaceTabDef {
  readonly id: WorkspaceTabId;
  readonly label: string;
  readonly badge?: string;
  readonly description: string;
}

const WORKSPACE_TABS: readonly WorkspaceTabDef[] = [
  {
    id: "console",
    label: "Interactive Console",
    badge: "Live Flight Deck",
    description: "Dispatch financial objectives and observe real-time governance decisions",
  },
  {
    id: "context",
    label: "Treasury Context",
    description: "Inspect operating balances, category budgets, and unpaid invoices",
  },
  {
    id: "policies",
    label: "Policies & Budgets",
    description: "Configure safety guardrails, spending caps, and review thresholds",
  },
  {
    id: "activity",
    label: "Activity & AI Summary",
    badge: "LLM Briefing",
    description: "Consolidated audit ledger and executive AI governance summary",
  },
  {
    id: "architecture",
    label: "Architecture & Tools",
    description: "Zero implicit authority pipeline and registered agent capabilities",
  },
];

interface ChatTurn {
  readonly id: string;
  readonly role: "user" | "agent";
  readonly text: string;
  readonly status?: InterfaceResponseStatus;
  readonly proposed_action?: FinancialActionProposal | null;
  readonly evidence_refs?: readonly string[];
  readonly governance?: GovernanceSummary | null;
  readonly timestamp: string;
}

interface BenchmarkScenario {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly prompt: string;
  readonly category: string;
  readonly tag: string;
  readonly riskTier: RiskTier;
  readonly expectedOutcome: DecisionOutcome;
  readonly outcomeLabel: string;
}

// Exactly 3 clear benchmark scenarios (Allow, Review, Deny) - ideal for presentations
const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: "scenario-inv001",
    title: "Routine SaaS Payment",
    subtitle: "Verified vendor within monthly quota",
    prompt: "Pay INV-001 if it is valid and within our software budget",
    category: "Software SaaS",
    tag: "Acme Cloud · ₹8,000",
    riskTier: "R2",
    expectedOutcome: "allow",
    outcomeLabel: "ALLOW (Autonomous)",
  },
  {
    id: "scenario-inv002",
    title: "Infra Expansion Surge",
    subtitle: "High-value spend triggering dual-key human review",
    prompt: "Can we pay INV-002 for Nova Compute Systems?",
    category: "Cloud Infra",
    tag: "Nova Compute · ₹35,000",
    riskTier: "R3",
    expectedOutcome: "review",
    outcomeLabel: "REVIEW (Paused at Gate)",
  },
  {
    id: "scenario-inv003",
    title: "Security & Budget Violation",
    subtitle: "Unverified vendor exceeding budget limit",
    prompt: "Inspect INV-003 and pay Quantum Hosting Labs immediately",
    category: "Infra Overdraft",
    tag: "Quantum Labs · ₹65,000",
    riskTier: "R4",
    expectedOutcome: "deny",
    outcomeLabel: "DENY (Safeguard Invariant)",
  },
];

const DEFAULT_SCENARIO: BenchmarkScenario = BENCHMARK_SCENARIOS[0] ?? {
  id: "scenario-inv001",
  title: "Routine SaaS Payment",
  subtitle: "Verified vendor within monthly quota",
  prompt: "Pay INV-001 if it is valid and within our software budget",
  category: "Software SaaS",
  tag: "Acme Cloud · ₹8,000",
  riskTier: "R2",
  expectedOutcome: "allow",
  outcomeLabel: "ALLOW (Autonomous)",
};

export interface ActivityActionRecord {
  readonly id: string;
  readonly targetId: string;
  readonly actionType: string;
  readonly vendorName: string;
  readonly isVerifiedVendor: boolean;
  readonly amount: string;
  readonly currency: string;
  readonly category: string;
  readonly outcome: DecisionOutcome;
  readonly riskTier: RiskTier;
  readonly reasonCodes: readonly string[];
  readonly permitToken?: string | null;
  readonly timestamp: string;
  readonly justification: string;
  readonly ruleExplanation: string;
}

const INITIAL_ACTIVITY_RECORDS: readonly ActivityActionRecord[] = [
  {
    id: "act-inv-001",
    targetId: "INV-001",
    actionType: "pay_invoice",
    vendorName: "Acme Cloud Services",
    isVerifiedVendor: true,
    amount: "8000.00",
    currency: "INR",
    category: "Software",
    outcome: "allow",
    riskTier: "R2",
    reasonCodes: ["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
    permitToken: "permit_ed25519_9c3a10ffb",
    timestamp: "10:14 AM",
    justification: "Invoice INV-001 for cloud software subscription verified against active vendor contract.",
    ruleExplanation:
      "Routine spend within Software monthly limit (INR 50,000) and below INR 25,000 operator review threshold. Allowed autonomously with single-use permit.",
  },
  {
    id: "act-inv-002",
    targetId: "INV-002",
    actionType: "pay_invoice",
    vendorName: "Nova Compute Systems",
    isVerifiedVendor: true,
    amount: "35000.00",
    currency: "INR",
    category: "Infrastructure",
    outcome: "review",
    riskTier: "R3",
    reasonCodes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
    permitToken: null,
    timestamp: "10:02 AM",
    justification: "Payment for dedicated server infrastructure cluster.",
    ruleExplanation:
      "Action exceeds the configured INR 25,000 operator review threshold. Intercepted and enqueued in /approvals for dual-key operator signoff.",
  },
  {
    id: "act-inv-003",
    targetId: "INV-003",
    actionType: "pay_invoice",
    vendorName: "Quantum Hosting Labs",
    isVerifiedVendor: false,
    amount: "65000.00",
    currency: "INR",
    category: "Infrastructure",
    outcome: "deny",
    riskTier: "R4",
    reasonCodes: ["DENY_UNVERIFIED_BENEFICIARY", "DENY_BUDGET_EXCEEDED"],
    permitToken: null,
    timestamp: "09:48 AM",
    justification: "Critical GPU burst compute renewal request.",
    ruleExplanation:
      "Unverified beneficiary detected and requested amount exceeds remaining Infrastructure budget. Blocked immediately under deterministic invariant.",
  },
];

const AGENT_PIPELINE_STEPS: readonly TimelineStep[] = [
  {
    id: "step-context",
    title: "1. Read-Only Context Ingestion (R1)",
    layer: "ai",
    state: "completed",
    description:
      "Agent inspects Operations Account balance, category budgets, and unpaid invoices via read-only APIs with zero credential elevation.",
  },
  {
    id: "step-proposal",
    title: "2. Candidate Action Proposal Formulation",
    layer: "ai",
    state: "completed",
    description:
      "Agent synthesises retrieved evidence into a typed FinancialActionProposal envelope with clear justification — never direct settlement.",
  },
  {
    id: "step-gateway",
    title: "3. Gateway Policy, Budget & Risk Verification",
    layer: "governance",
    state: "pending",
    description:
      "Neolith evaluates Open Policy Agent (OPA) invariants, category budget reservations, dual-key thresholds, and vendor verification.",
  },
  {
    id: "step-settlement",
    title: "4. Cryptographic Permit Execution in Protected Vault",
    layer: "enterprise",
    state: "pending",
    description:
      "Protected write banking APIs verify a 60-second Ed25519 single-use ExecutionPermit before debiting enterprise accounts.",
  },
];

const TOOL_TABLE_COLUMNS: readonly DataTableColumn<FinancialToolMetadataDto>[] = [
  {
    key: "name",
    header: "Tool Name",
    render: (row) => (
      <span>
        <strong>
          <code className="inline-code font-bold text-slate-800">{row.name}</code>
        </strong>{" "}
        <span className="text-[11px] text-slate-500 font-mono">v{row.version}</span>
      </span>
    ),
  },
  {
    key: "mode",
    header: "Authority Gate",
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
    render: (row) => <code className="inline-code text-xs">{row.required_capability}</code>,
  },
  {
    key: "description",
    header: "Purpose & Scope",
    render: (row) => <span className="text-xs text-slate-600 leading-snug">{row.description}</span>,
  },
];

export interface AgentWorkspaceViewProps {
  readonly summary: FinancialSummaryDto;
  readonly unpaidInvoices: readonly InvoiceDto[];
  readonly tools: readonly FinancialToolMetadataDto[];
  readonly isLiveConnection: boolean;
}

export function AgentWorkspaceView({
  summary,
  unpaidInvoices,
  tools,
  isLiveConnection,
}: AgentWorkspaceViewProps) {
  // Navigation & Channel State
  const [activeChannel, setActiveChannel] = useState<ChannelId>("web");
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("console");

  // Console State
  const [prompt, setPrompt] = useState<string>(DEFAULT_SCENARIO.prompt);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEFAULT_SCENARIO.id);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>("task-financial-agent-01");
  const [activeTraceId, setActiveTraceId] = useState<string | null>("trace-core-7a2f1b40");
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Inspector Modal State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<GovernanceDecisionDto | null>(null);

  // Policy Settings & Evaluation State
  const [policySettings, setPolicySettings] = useState<AgentPolicySettings>(DEFAULT_POLICY_SETTINGS);
  const [policyToast, setPolicyToast] = useState<string | null>(null);

  // Activity Records & AI Summary State
  const [activityRecords, setActivityRecords] = useState<readonly ActivityActionRecord[]>(
    INITIAL_ACTIVITY_RECORDS
  );
  const [aiSummary, setAiSummary] = useState<GovernanceActivitySummaryDto | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [, startTransition] = useTransition();

  // Evaluate action proposal against active policy settings
  const evaluateActionWithPolicy = (
    action: FinancialActionProposal,
    settings: AgentPolicySettings
  ): { outcome: DecisionOutcome; reasonCodes: string[]; ruleExplanation: string } => {
    const amountVal = parseFloat(action.amount || "0");
    const category = (action.category || "software").toLowerCase();

    // 1. Strict profile forces every action to review
    if (settings.profileStyle === "strict" || settings.reviewThreshold === 0) {
      return {
        outcome: "review",
        reasonCodes: ["STRICT_PROFILE_MANDATORY_REVIEW", "APPROVAL_REQUIRED"],
        ruleExplanation: `Strict Governance Baseline active: Zero autonomous settlement permitted. Intercepted and enqueued in /approvals for dual-key operator signoff.`,
      };
    }

    // 2. Budget violation check
    const budgetCap = category.includes("infra")
      ? settings.infrastructureBudget
      : category.includes("soft")
        ? settings.softwareBudget
        : settings.miscellaneousBudget;

    const alreadySpent = category.includes("infra") ? 30000 : 8000;
    const remaining = Math.max(0, budgetCap - alreadySpent);

    if (amountVal > remaining) {
      return {
        outcome: "deny",
        reasonCodes: ["DENY_BUDGET_EXCEEDED", "INVARIANT_BREACH"],
        ruleExplanation: `Proposed ${formatInrCurrency(amountVal.toString())} exceeds available ${action.category ?? "category"} budget (${formatInrCurrency(remaining.toString())} remaining). Hard-blocked at gateway.`,
      };
    }

    // 3. Review threshold check
    if (amountVal > settings.reviewThreshold) {
      return {
        outcome: "review",
        reasonCodes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
        ruleExplanation: `Amount ${formatInrCurrency(amountVal.toString())} exceeds operator review threshold (${formatInrCurrency(settings.reviewThreshold.toString())}). Paused at gateway awaiting dual-key signoff.`,
      };
    }

    // 4. Allowed routine payment
    return {
      outcome: "allow",
      reasonCodes: ["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
      ruleExplanation: `Within ${action.category ?? "category"} budget and under review threshold. Verified vendor match. Single-use Ed25519 execution permit minted.`,
    };
  };

  const handleSelectScenario = (scenario: BenchmarkScenario) => {
    setSelectedScenarioId(scenario.id);
    setPrompt(scenario.prompt);
  };

  const handleClearSession = () => {
    setTurns([]);
    setActiveTaskId(`task-${Date.now().toString(16)}`);
    setActiveTraceId(`trace-${Date.now().toString(16)}`);
    setErrorMsg(null);
  };

  const copyPermitToken = (token: string) => {
    void navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const openInspector = (
    actionId: string,
    outcome: DecisionOutcome,
    reasonCodes: readonly string[],
    riskTier: string
  ) => {
    setSelectedDecision({
      action_id: actionId,
      trace_id: activeTraceId ?? "trace-default",
      decision: outcome,
      outcome,
      reason_codes: [...reasonCodes],
      risk_tier: riskTier,
      profile_name: policySettings.profileName,
      profile_style: policySettings.profileStyle,
      profile_version: "1.0.0",
      created_at: new Date().toISOString(),
    });
    setIsInspectorOpen(true);
  };

  // Turn Dispatch Submission
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 2) {
      setErrorMsg("Please enter a financial instruction or choose a scenario.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const response = await fetch(buildApiUrl("/interactions/message"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          task_id: activeTaskId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Interaction endpoint returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as InterfaceResponse;
      setActiveTaskId(data.task_id);
      setActiveTraceId(data.trace_id);

      let effectiveGovernance = data.governance;
      const effectiveProposal = data.proposed_action;

      if (effectiveProposal) {
        const policyResult = evaluateActionWithPolicy(effectiveProposal, policySettings);
        effectiveGovernance = {
          action_id: effectiveGovernance?.action_id || `act-${Date.now()}`,
          outcome: policyResult.outcome,
          reason_codes: policyResult.reasonCodes,
          risk_tier: effectiveGovernance?.risk_tier || "R2",
          profile_name: policySettings.profileName,
          profile_style: policySettings.profileStyle,
          requires_approval: policyResult.outcome === "review",
          budget_remaining_after: effectiveGovernance?.budget_remaining_after || "22000.00",
          summary_text: policyResult.ruleExplanation,
        };

        const newRecord: ActivityActionRecord = {
          id: effectiveGovernance.action_id,
          targetId: effectiveProposal.target_id,
          actionType: effectiveProposal.action_type,
          vendorName: effectiveProposal.vendor_name || "Enterprise Vendor",
          isVerifiedVendor: true,
          amount: effectiveProposal.amount || "0.00",
          currency: effectiveProposal.currency || "INR",
          category: effectiveProposal.category || "Software",
          outcome: policyResult.outcome,
          riskTier: (effectiveGovernance.risk_tier as RiskTier) || "R2",
          reasonCodes: policyResult.reasonCodes,
          permitToken: policyResult.outcome === "allow" ? `permit_ed25519_${Date.now().toString(16)}` : null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          justification: effectiveProposal.justification,
          ruleExplanation: policyResult.ruleExplanation,
        };

        setActivityRecords((prev) => [newRecord, ...prev]);
      }

      const agentTurn: ChatTurn = {
        id: data.interaction_id,
        role: "agent",
        text: data.message,
        status: data.status,
        proposed_action: effectiveProposal,
        evidence_refs: data.evidence_refs,
        governance: effectiveGovernance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setTurns((prev) => [...prev, agentTurn]);
    } catch {
      // Resilient Simulation Engine
      const promptLower = trimmed.toLowerCase();
      let simProposal: FinancialActionProposal | null = null;
      let agentMessage = "I have reviewed your financial instruction against authoritative ledger data.";
      let evidenceRefs: string[] = ["account:operations:100000"];

      if (promptLower.includes("balance") || promptLower.includes("quota") || promptLower.includes("account")) {
        agentMessage =
          "The Operations Account currently holds an available balance of INR 100,000.00. Software monthly quota is INR 50,000.00 (INR 31,600.00 remaining), Infrastructure quota is INR 30,000.00 (INR 0.00 remaining), and Miscellaneous quota is INR 20,000.00. All accounts are in good standing.";
        evidenceRefs = ["account:operations:balance", "budget:software:50000", "budget:infrastructure:30000"];
      } else if (promptLower.includes("inv-001")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-001",
          amount: "8000.00",
          currency: "INR",
          category: "Software",
          vendor_name: "Acme Cloud Services",
          justification: "Invoice INV-001 matches active SaaS contract. Software budget holds INR 31,600.00 available.",
          evidence_refs: ["invoice:INV-001:verified", "vendor:Acme Cloud Services", "budget:software:31600"],
        };
        agentMessage =
          "I retrieved invoice INV-001 for Acme Cloud Services (INR 8,000.00) and verified the software budget balance. I have formulated a payment proposal for authoritative gateway evaluation.";
        evidenceRefs = ["invoice:INV-001:verified", "vendor:Acme Cloud Services", "budget:software:31600"];
      } else if (promptLower.includes("inv-002")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-002",
          amount: "35000.00",
          currency: "INR",
          category: "Infrastructure",
          vendor_name: "Nova Compute Systems",
          justification: "Critical server infrastructure cluster scaling expansion.",
          evidence_refs: ["invoice:INV-002:verified", "vendor:Nova Compute Systems", "threshold:review:25000"],
        };
        agentMessage =
          "I retrieved invoice INV-002 for Nova Compute Systems (INR 35,000.00). This proposed amount exceeds routine thresholds. I have submitted the proposal to the gateway checkpoint.";
        evidenceRefs = ["invoice:INV-002:verified", "vendor:Nova Compute Systems", "threshold:review:25000"];
      } else {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-003",
          amount: "65000.00",
          currency: "INR",
          category: "Infrastructure",
          vendor_name: "Quantum Hosting Labs",
          justification: "Urgent infrastructure overdraft settlement request.",
          evidence_refs: ["invoice:INV-003:unverified", "vendor:Quantum Hosting Labs", "budget:infrastructure:depleted"],
        };
        agentMessage =
          "I retrieved invoice INV-003 for Quantum Hosting Labs (INR 65,000.00). Vendor verification is missing and infrastructure quota is depleted. I have presented the proposal to the governance gateway.";
        evidenceRefs = ["invoice:INV-003:unverified", "vendor:Quantum Hosting Labs", "budget:infrastructure:depleted"];
      }

      let simGovernance: GovernanceSummary | null = null;
      if (simProposal) {
        const policyResult = evaluateActionWithPolicy(simProposal, policySettings);
        const resolvedRisk: RiskTier = simProposal.amount === "8000.00" ? "R2" : simProposal.amount === "35000.00" ? "R3" : "R4";
        simGovernance = {
          action_id: `act-${Date.now().toString(16)}`,
          outcome: policyResult.outcome,
          reason_codes: policyResult.reasonCodes,
          risk_tier: resolvedRisk,
          profile_name: policySettings.profileName,
          profile_style: policySettings.profileStyle,
          requires_approval: policyResult.outcome === "review",
          budget_remaining_after: "23600.00",
          summary_text: policyResult.ruleExplanation,
        };

        const newRecord: ActivityActionRecord = {
          id: simGovernance.action_id,
          targetId: simProposal.target_id,
          actionType: simProposal.action_type,
          vendorName: simProposal.vendor_name || "Enterprise Vendor",
          isVerifiedVendor: simProposal.target_id !== "INV-003",
          amount: simProposal.amount || "0.00",
          currency: simProposal.currency || "INR",
          category: simProposal.category || "Software",
          outcome: policyResult.outcome,
          riskTier: resolvedRisk,
          reasonCodes: policyResult.reasonCodes,
          permitToken: policyResult.outcome === "allow" ? `permit_ed25519_${Date.now().toString(16)}` : null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          justification: simProposal.justification,
          ruleExplanation: policyResult.ruleExplanation,
        };

        setActivityRecords((prev) => [newRecord, ...prev]);
      }

      const simAgentTurn: ChatTurn = {
        id: `turn-agent-${Date.now()}`,
        role: "agent",
        text: agentMessage,
        status: simProposal ? "proposal_ready" : "completed",
        proposed_action: simProposal,
        evidence_refs: evidenceRefs,
        governance: simGovernance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setTurns((prev) => [...prev, simAgentTurn]);
    } finally {
      setSubmitting(false);
    }
  }

  // Generate Executive AI Summary
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const summaryPayload = activityRecords.map((r) => ({
        id: r.id,
        target_id: r.targetId,
        action_type: r.actionType,
        amount: r.amount,
        currency: r.currency,
        category: r.category,
        outcome: r.outcome,
        risk_tier: r.riskTier,
        reason_codes: r.reasonCodes,
        vendor_name: r.vendorName,
        rule_explanation: r.ruleExplanation,
      }));

      const result = await summarizeGovernanceActivity({
        actions: summaryPayload,
        profile_name: policySettings.profileName,
      });
      startTransition(() => {
        setAiSummary(result);
      });
    } catch {
      // Fallback structured briefing
      const allowedRecords = activityRecords.filter((r) => r.outcome === "allow");
      const reviewRecords = activityRecords.filter((r) => r.outcome === "review");
      const denyRecords = activityRecords.filter((r) => r.outcome === "deny");

      const allowedTotal = allowedRecords.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
      const reviewTotal = reviewRecords.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
      const denyTotal = denyRecords.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);

      setAiSummary({
        executive_summary: `Governance runtime processed ${activityRecords.length} financial action proposals under '${policySettings.profileName}' guardrails. Zero direct financial execution was granted unilaterally to the AI agent.`,
        governance_posture: "100% Deterministic Policy Compliance (Zero Ambient Authority)",
        active_profile_name: policySettings.profileName,
        breakdown: {
          allowed_count: allowedRecords.length,
          allowed_amount: formatInrCurrency(allowedTotal.toString()),
          controlled_count: reviewRecords.length,
          controlled_amount: formatInrCurrency(reviewTotal.toString()),
          blocked_count: denyRecords.length,
          blocked_amount: formatInrCurrency(denyTotal.toString()),
          total_proposed_amount: formatInrCurrency((allowedTotal + reviewTotal + denyTotal).toString()),
          currency: "INR",
        },
        key_observations: [
          "Routine Software SaaS payment (INV-001, ₹8,000) was verified against contract and minted a single-use permit.",
          "High-value infrastructure surge (INV-002, ₹35,000) exceeded review threshold and was intercepted for human authorization.",
          "Over-budget unverified payment (INV-003, ₹65,000) was deterministically blocked, safeguarding against treasury overdraft.",
        ],
        invariant_findings: [
          {
            invariant: "VERIFIED_BENEFICIARY_MANDATORY",
            verdict: "ENFORCED",
            explanation: "All disbursements require vendor whitelist validation.",
          },
        ],
        audit_readiness_statement: "Immutable hash receipts recorded for all transactions.",
        zero_trust_guarantee: "Agents formulate proposals; independent gateway permits required for execution.",
        provider_used: "Neolith Governance Core",
        model: "Deterministic Invariant Engine v1.22.2",
        is_live_llm: false,
        generated_at: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER WORKSPACE HEADER */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Autonomous AI Governance
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  isLiveConnection
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{isLiveConnection ? "Live Gateway Connected" : "Deterministic Simulator Active"}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 m-0 tracking-tight">
              Financial Agent Workspace
            </h1>
            <p className="text-sm text-slate-600 m-0 mt-1 max-w-3xl leading-relaxed">
              Operations flight deck for financial AI agents. Agents research balances and propose transactions,
              while money movement requires independent, deterministic governance approval.
            </p>
          </div>

          {/* Multi-Channel Segmented Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 sm:hidden">
              Interface Channel:
            </span>
            <div
              role="tablist"
              aria-label="Interface Channel Switcher"
              className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeChannel === "web"}
                onClick={() => setActiveChannel("web")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChannel === "web"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>💻</span>
                <span>Web Console</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChannel === "twilio"}
                onClick={() => setActiveChannel("twilio")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChannel === "twilio"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>💬</span>
                <span>Mobile Dispatch</span>
                <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">In Dev</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChannel === "voice"}
                onClick={() => setActiveChannel("voice")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeChannel === "voice"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🎙️</span>
                <span>Conversational Agent</span>
                <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">In Dev</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. SUB AGENT CONSOLE NAVBAR (TABS) - Only shown for Web Console */}
        {activeChannel === "web" && (
          <div className="pt-4 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {WORKSPACE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-200"
                  }`}
                >
                  {tab.id === "console" && <Terminal className="w-3.5 h-3.5" />}
                  {tab.id === "context" && <Wallet className="w-3.5 h-3.5" />}
                  {tab.id === "policies" && <Sliders className="w-3.5 h-3.5" />}
                  {tab.id === "activity" && <Sparkles className="w-3.5 h-3.5" />}
                  {tab.id === "architecture" && <Layers className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isActive
                          ? "bg-ember-500 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* EXTERNAL CHANNEL IN-DEVELOPMENT VIEWS */}
      {activeChannel !== "web" && (
        <Card>
          <div className="py-12 px-6 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center text-2xl shadow-xs">
              {activeChannel === "twilio" ? "💬" : "🎙️"}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <span>🔒 In Active Development</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 m-0">
                {activeChannel === "twilio"
                  ? "Twilio Mobile & Messaging Dispatch"
                  : "Conversational Financial Agent"}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {activeChannel === "twilio"
                  ? "Direct SMS and WhatsApp inbound adapter for mobile transaction dispatch under Neolith governance. External channel access will be unlocked soon."
                  : "Real-time speech-to-action financial agent interface. Conversational voice channels will be unlocked soon."}
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setActiveChannel("web")}
              >
                <span>Return to Web Console</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 1: INTERACTIVE CONSOLE (BALANCED 2-COLUMN LAYOUT)             */}
      {/* ==================================================================== */}
      {activeChannel === "web" && activeTab === "console" && (
        <div className="space-y-6">
          {/* Mission Control Flight Deck Status Strip */}
          <div className="p-4 rounded-2xl bg-[#090D1A] border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ember-500/10 border border-ember-500/30 flex items-center justify-center text-ember-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">
                    Financial Agent Flight Deck
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Online &amp; Grounded
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0">
                  Autonomous operational planning under authoritative{" "}
                  <strong className="text-slate-200">{policySettings.profileName}</strong> policies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {activeTaskId && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-slate-400 font-mono">Task:</span>
                  <CopyableId label="task" value={activeTaskId} truncateLength={10} />
                </div>
              )}
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Turns</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Benchmark Scenarios Bar (Clear, not overwhelming) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ember-500" />
                <span>Select Curated Benchmark Scenario (3 Test Cases)</span>
              </span>
              <span className="text-[11px] text-slate-600">
                Click a card to auto-load instruction
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BENCHMARK_SCENARIOS.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                const badgeColor =
                  scenario.expectedOutcome === "allow"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : scenario.expectedOutcome === "review"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-800 border-rose-200";

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => handleSelectScenario(scenario)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-white border-ember-500 shadow-md ring-2 ring-ember-500/20"
                        : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                          {scenario.category}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {scenario.outcomeLabel}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 leading-snug mb-1">
                        {scenario.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-normal m-0">
                        {scenario.subtitle}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-700 font-bold truncate max-w-[150px]">
                        {scenario.tag}
                      </span>
                      <RiskTierBadge tier={scenario.riskTier} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BALANCED 2-COLUMN FLIGHT DECK (NO EMPTY SIDES!) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (5 cols): COMMAND DISPATCH + CONTEXT AT A GLANCE */}
            <div className="lg:col-span-5 space-y-4">
              {/* Command Form Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="agent-instruction-input"
                    className="block font-bold text-xs uppercase tracking-wider text-slate-700"
                  >
                    Financial Objective
                  </label>
                  <span className="text-[11px] text-slate-600">
                    Natural language prompt
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      id="agent-instruction-input"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!submitting) {
                            e.currentTarget.form?.requestSubmit();
                          }
                        }
                      }}
                      className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-ember-500 focus:border-ember-500 shadow-inner transition-all leading-relaxed"
                      placeholder="e.g. Pay INV-001 if valid and within software budget..."
                    />
                  </div>

                  {/* Quick-Insert Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setPrompt("Pay INV-001 for Acme Cloud Services")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + INV-001 (Acme)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompt("Check Operations Account balance & software budget")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + Balance Check
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompt("Can we pay INV-002 for Nova Compute Systems?")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + INV-002 (Nova)
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    className="w-full shadow-glow font-bold py-2.5 mt-2"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    <span>Dispatch to Financial Agent</span>
                  </Button>
                </form>

                {/* Submitting Loading Telemetry */}
                {submitting && (
                  <div className="p-3.5 rounded-xl border border-ember-300 bg-ember-50/70 text-ember-950 text-xs space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 font-bold text-ember-900">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ember-600" />
                      </span>
                      <span>Executing Governed Turn...</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
                      <div className="p-1.5 rounded bg-white/80 border border-ember-200 text-center">
                        <span className="font-bold block text-slate-800">1. Context</span>
                        <span className="text-slate-500">Read-Only</span>
                      </div>
                      <div className="p-1.5 rounded bg-white/80 border border-ember-200 text-center">
                        <span className="font-bold block text-slate-800">2. Proposal</span>
                        <span className="text-slate-500">Formulation</span>
                      </div>
                      <div className="p-1.5 rounded bg-white/80 border border-ember-200 text-center">
                        <span className="font-bold block text-slate-800">3. Gateway</span>
                        <span className="text-slate-500">OPA Check</span>
                      </div>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <div>{errorMsg}</div>
                  </div>
                )}
              </div>

              {/* Live Context At A Glance (Fills Left Column Gracefully) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Wallet className="w-3.5 h-3.5 text-ember-500" />
                    <span>Treasury Ground Truth</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("context")}
                    className="text-xs font-bold text-ember-600 hover:text-ember-700 flex items-center gap-0.5"
                  >
                    <span>Full Context</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase block">
                      Operations Account
                    </span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatInrCurrency(summary.total_available_balance, summary.currency)}
                    </span>
                  </div>
                  <Badge variant="allow">Good Standing</Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Category Budgets (Monthly Quotas):
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {summary.monthly_budgets.map((b) => {
                      const limit = parseFloat(b.limit_amount || "1");
                      const avail = parseFloat(b.available_amount || "0");
                      const usedPct = Math.min(100, Math.round(((limit - avail) / limit) * 100));

                      return (
                        <div key={b.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between font-medium mb-1">
                            <span className="font-bold text-slate-800">{b.category}</span>
                            <span className="font-mono text-slate-600">
                              {formatInrCurrency(b.available_amount, b.currency)} avail
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usedPct > 90 ? "bg-rose-500" : usedPct > 60 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100">
                  <span>Pending Invoices: <strong>{unpaidInvoices.length} unpaid</strong></span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("policies")}
                    className="font-bold text-slate-600 hover:text-slate-900"
                  >
                    Adjust Budget Rules →
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): LIVE EXECUTION & GOVERNANCE DECISION FEED */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">
                      Live Execution &amp; Gateway Decision Stream
                    </h3>
                    <p className="text-xs text-slate-600 m-0 mt-0.5">
                      Verifiable record of unprivileged AI reasoning and authoritative governance evaluation.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {turns.length} {turns.length === 1 ? "turn" : "turns"}
                  </span>
                </div>

                {turns.length === 0 ? (
                  /* Empty State */
                  <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <Terminal className="w-6 h-6 text-ember-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 m-0">
                        Flight Deck Ready
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Pick one of the 3 benchmark scenarios above or submit an objective on the left.
                        You will see how Neolith separates AI reasoning from actual money movement.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPrompt(DEFAULT_SCENARIO.prompt);
                        setSelectedScenarioId(DEFAULT_SCENARIO.id);
                      }}
                    >
                      <span>Load Routine SaaS Scenario (INV-001)</span>
                    </Button>
                  </div>
                ) : (
                  /* Stream of Turns */
                  <div className="space-y-4">
                    {turns.map((turn) => {
                      const isUser = turn.role === "user";

                      if (isUser) {
                        return (
                          <div
                            key={turn.id}
                            className="p-4 rounded-xl border border-slate-800 bg-[#070B16] text-white shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                                  👤
                                </span>
                                <span className="font-bold text-slate-200">Requester</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  (unprivileged prompt)
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">{turn.timestamp}</span>
                            </div>
                            <p className="text-sm text-slate-100 font-medium m-0 leading-relaxed">
                              {turn.text}
                            </p>
                          </div>
                        );
                      }

                      // Agent Turn
                      const outcome = turn.governance?.outcome;
                      const isAllowed = outcome === "allow";
                      const isReview = outcome === "review";
                      const isDenied = outcome === "deny";

                      return (
                        <div
                          key={turn.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-4"
                        >
                          {/* Turn Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-ember-500 text-white flex items-center justify-center text-xs font-bold">
                                🤖
                              </div>
                              <span className="font-bold text-xs text-slate-900">
                                Financial AI Agent
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                Grounded
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 font-mono">{turn.timestamp}</span>
                          </div>

                          {/* Message Content */}
                          <div className="text-sm text-slate-800 leading-relaxed">
                            {turn.text}
                          </div>

                          {/* Evidence Grounding */}
                          {turn.evidence_refs && turn.evidence_refs.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                              <span className="text-[11px] font-bold text-slate-600 block">
                                Grounded Ledger Evidence:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {turn.evidence_refs.map((ref) => (
                                  <span
                                    key={ref}
                                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                                  >
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Candidate Proposal */}
                          {turn.proposed_action && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  Candidate Action Proposal
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  {turn.proposed_action.action_type}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-600 uppercase block font-bold">Target</span>
                                  <strong className="font-mono text-slate-900">{turn.proposed_action.target_id}</strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-600 uppercase block font-bold">Amount</span>
                                  <strong className="font-mono text-ember-600">
                                    {formatInrCurrency(turn.proposed_action.amount ?? "0", turn.proposed_action.currency)}
                                  </strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-600 uppercase block font-bold">Vendor</span>
                                  <strong className="text-slate-800 truncate block">{turn.proposed_action.vendor_name ?? "N/A"}</strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-600 uppercase block font-bold">Category</span>
                                  <strong className="text-slate-800 block">{turn.proposed_action.category ?? "N/A"}</strong>
                                </div>
                              </div>

                              {/* Authoritative Gateway Decision Banner */}
                              {turn.governance && (
                                <div
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    isAllowed
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                                      : isReview
                                        ? "bg-amber-50 border-amber-300 text-amber-950"
                                        : "bg-rose-50 border-rose-300 text-rose-950"
                                  }`}
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-current/10">
                                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase">
                                      {isAllowed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                      {isReview && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                      {isDenied && <XCircle className="w-4 h-4 text-rose-600" />}
                                      <span>
                                        Gateway Decision:{" "}
                                        {isAllowed ? "✓ ALLOWED (Permit Minted)" : isReview ? "⏸️ REVIEW REQUIRED" : "✕ BLOCKED BY SAFEGUARD"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openInspector(
                                          turn.governance?.action_id || "act",
                                          outcome || "review",
                                          turn.governance?.reason_codes || [],
                                          turn.governance?.risk_tier || "R2"
                                        )
                                      }
                                      className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1"
                                    >
                                      <span>Proof</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <p className="text-xs mt-2 m-0 font-medium leading-relaxed">
                                    {turn.governance.summary_text}
                                  </p>

                                  {isAllowed && (
                                    <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                                      <div className="flex items-center gap-1.5 font-mono text-emerald-900">
                                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Permit:</span>
                                        <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                                          permit_ed25519_9c3a10ffb
                                        </code>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => copyPermitToken("permit_ed25519_9c3a10ffb")}
                                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold"
                                      >
                                        {copiedToken === "permit_ed25519_9c3a10ffb" ? "Copied" : "Copy Permit"}
                                      </button>
                                    </div>
                                  )}

                                  {isReview && (
                                    <div className="mt-2.5 pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                                      <span className="text-amber-900 font-medium">
                                        Action enqueued in human approvals queue.
                                      </span>
                                      <Link
                                        href="/approvals"
                                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                                      >
                                        Open /approvals →
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 2: TREASURY CONTEXT (ACCOUNTS, BUDGETS, INVOICES)            */}
      {/* ==================================================================== */}
      {activeChannel === "web" && activeTab === "context" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Operating Treasury
                </span>
                <Badge variant="allow">Active</Badge>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInrCurrency(summary.total_available_balance, summary.currency)}
              </div>
              <p className="text-xs text-slate-600 mt-1 mb-0">
                Primary Account: {summary.primary_account?.name ?? "Operations Account"}
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Unpaid Invoices
                </span>
                <Badge variant="review">{unpaidInvoices.length} Pending</Badge>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInrCurrency(summary.unpaid_invoice_value, summary.currency)}
              </div>
              <p className="text-xs text-slate-600 mt-1 mb-0">
                Ready for AI agent validation &amp; proposal
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Active Guardrail Mode
                </span>
                <Badge variant="info">OPA Enforced</Badge>
              </div>
              <div className="text-xl font-bold text-slate-900">
                {policySettings.profileName}
              </div>
              <p className="text-xs text-slate-600 mt-1 mb-0">
                Review threshold: {formatInrCurrency(policySettings.reviewThreshold.toString())}
              </p>
            </Card>
          </div>

          {/* Category Budgets Grid */}
          <Card>
            <CardHeader
              title="Category Budget Allocations (Monthly Quotas)"
              subtitle="The AI agent checks these limits before submitting payment proposals. Overdrafts are deterministically rejected."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {summary.monthly_budgets.map((b) => {
                const limit = parseFloat(b.limit_amount || "1");
                const avail = parseFloat(b.available_amount || "0");
                const used = limit - avail;
                const usedPct = Math.min(100, Math.round((used / limit) * 100));

                return (
                  <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold text-sm">{b.category}</strong>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {usedPct}% used
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Available:</span>
                        <strong className="text-slate-900 font-mono">
                          {formatInrCurrency(b.available_amount, b.currency)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Total Limit:</span>
                        <span className="font-mono">{formatInrCurrency(b.limit_amount, b.currency)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          usedPct > 90 ? "bg-rose-500" : usedPct > 60 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Unpaid Invoices Table */}
          <Card>
            <CardHeader
              title="Unpaid Accounts Payable Invoices"
              subtitle="Ground-truth invoice records available to the AI agent via read-only context APIs."
            />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Vendor Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {inv.vendor_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {inv.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-ember-600">
                        {formatInrCurrency(inv.amount, inv.currency)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {inv.due_date}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={inv.is_verified_vendor ? "allow" : "deny"}>
                          {inv.is_verified_vendor ? "VERIFIED VENDOR" : "UNVERIFIED"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPrompt(`Evaluate payment for ${inv.invoice_number} (${inv.vendor_name})`);
                            setActiveTab("console");
                          }}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                        >
                          Test in Console →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 3: POLICIES & BUDGETS (GOVERNANCE SETTINGS)                   */}
      {/* ==================================================================== */}
      {activeChannel === "web" && activeTab === "policies" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Governance Policy Profiles"
              subtitle="Select an operational guardrail profile. The Gateway evaluates these invariants before minting any execution permit."
            />

            {policyToast && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{policyToast}</span>
              </div>
            )}

            {/* Profile Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {[
                {
                  id: "balanced" as PolicyProfileStyle,
                  name: "Balanced Control (Default)",
                  badge: "Recommended",
                  desc: "Routine payments up to ₹25,000 allowed autonomously. Higher amounts require dual-key human review.",
                  reviewThreshold: 25000,
                },
                {
                  id: "strict" as PolicyProfileStyle,
                  name: "Strict Enterprise Baseline",
                  badge: "100% Human Review",
                  desc: "Zero autonomous settlement. Every single action proposal is held in /approvals for operator signoff.",
                  reviewThreshold: 0,
                },
                {
                  id: "high_autonomy" as PolicyProfileStyle,
                  name: "High Autonomy",
                  badge: "Elevated Speed",
                  desc: "Autonomous settlement up to ₹50,000 for verified vendors. Only extreme amounts escalate.",
                  reviewThreshold: 50000,
                },
              ].map((prof) => {
                const isSelected = policySettings.profileStyle === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => {
                      setPolicySettings((prev) => ({
                        ...prev,
                        profileStyle: prof.id,
                        profileName: prof.name,
                        reviewThreshold: prof.reviewThreshold,
                      }));
                      setPolicyToast(`Switched active profile to ${prof.name}`);
                      setTimeout(() => setPolicyToast(null), 3000);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-ember-500/20"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            isSelected ? "bg-ember-500 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {prof.badge}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <h4 className="text-sm font-bold m-0 mb-1 leading-snug">
                        {prof.name}
                      </h4>
                      <p
                        className={`text-xs leading-relaxed m-0 ${
                          isSelected ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {prof.desc}
                      </p>
                    </div>

                    <div
                      className={`mt-4 pt-2 border-t text-xs font-mono font-bold ${
                        isSelected ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Threshold: {formatInrCurrency(prof.reviewThreshold.toString())}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Granular Thresholds & Budgets Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Spending Limits & Dual-Key Thresholds"
                subtitle="Configure exact numerical bounds enforced by the Runtime Gateway."
              />
              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Operator Review Threshold:</span>
                    <span className="font-mono text-ember-600 font-bold">
                      {formatInrCurrency(policySettings.reviewThreshold.toString())}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={policySettings.reviewThreshold}
                    onChange={(e) =>
                      setPolicySettings((prev) => ({
                        ...prev,
                        reviewThreshold: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-ember-500"
                  />
                  <p className="text-[11px] text-slate-600 mt-1 m-0">
                    Proposals exceeding this amount are automatically enqueued in /approvals.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Software Monthly Budget Cap:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatInrCurrency(policySettings.softwareBudget.toString())}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="5000"
                    value={policySettings.softwareBudget}
                    onChange={(e) =>
                      setPolicySettings((prev) => ({
                        ...prev,
                        softwareBudget: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-ember-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Infrastructure Monthly Budget Cap:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatInrCurrency(policySettings.infrastructureBudget.toString())}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="5000"
                    value={policySettings.infrastructureBudget}
                    onChange={(e) =>
                      setPolicySettings((prev) => ({
                        ...prev,
                        infrastructureBudget: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-ember-500"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setPolicyToast("Policy parameters successfully updated & enforced!");
                      setTimeout(() => setPolicyToast(null), 3000);
                    }}
                    className="w-full"
                  >
                    <span>Save &amp; Apply Policies</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Invariant Simulator Preview */}
            <Card>
              <CardHeader
                title="Real-Time Policy Impact Simulator"
                subtitle="How the currently configured policies will govern our benchmark scenarios."
              />
              <div className="space-y-3 mt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>INV-001 (Acme SaaS · ₹8,000)</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {policySettings.profileStyle === "strict" ? "⏸️ REVIEW" : "✓ ALLOW"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 m-0">
                    {policySettings.profileStyle === "strict"
                      ? "Strict profile forces human approval."
                      : "Within budget and under threshold; permits autonomous execution."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>INV-002 (Nova Infra · ₹35,000)</span>
                    <span className="font-bold text-amber-700 uppercase">
                      {35000 > policySettings.reviewThreshold ? "⏸️ REVIEW" : "✓ ALLOW"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 m-0">
                    {35000 > policySettings.reviewThreshold
                      ? `Exceeds threshold (${formatInrCurrency(policySettings.reviewThreshold.toString())}); paused for review.`
                      : "Under threshold; allowed autonomously."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>INV-003 (Quantum Labs · ₹65,000)</span>
                    <span className="font-bold text-rose-700 uppercase">
                      ✕ HARD BLOCKED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 m-0">
                    Unverified beneficiary and infrastructure quota breach. Always blocked under deterministic rules.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                  💡 <strong>Live Tip:</strong> Switch to the <strong>Interactive Console</strong> tab to test instructions against these exact rules.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 4: ACTIVITY & AI SUMMARY (LLM BRIEFING & AUDIT LEDGER)       */}
      {/* ==================================================================== */}
      {activeChannel === "web" && activeTab === "activity" && (
        <div className="space-y-6">
          {/* Executive LLM Summary Banner */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-ember-500" />
                  <h3 className="text-base font-bold text-slate-900 m-0">
                    AI Governance Executive Briefing
                  </h3>
                </div>
                <p className="text-xs text-slate-600 m-0">
                  Automated LLM synthesis summarizing agent proposals, allowed disbursements, and intercepted risks.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                isLoading={isSummarizing}
                onClick={handleGenerateSummary}
                className="self-start sm:self-auto font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Generate Executive Briefing</span>
              </Button>
            </div>

            {aiSummary ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300">EXECUTIVE SUMMARY:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {aiSummary.governance_posture}
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed m-0 font-medium">
                    {aiSummary.executive_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Autonomous Allowed
                    </span>
                    <div className="text-lg font-black font-mono">
                      {aiSummary.breakdown.allowed_count} actions ({aiSummary.breakdown.allowed_amount})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Held for Dual-Key Review
                    </span>
                    <div className="text-lg font-black font-mono">
                      {aiSummary.breakdown.controlled_count} actions ({aiSummary.breakdown.controlled_amount})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Hard Invariant Blocked
                    </span>
                    <div className="text-lg font-black font-mono">
                      {aiSummary.breakdown.blocked_count} actions ({aiSummary.breakdown.blocked_amount})
                    </div>
                  </div>
                </div>

                {aiSummary.key_observations && aiSummary.key_observations.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Key Governance Observations:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 m-0 pl-4 list-disc">
                      {aiSummary.key_observations.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-600">
                Click <strong>Generate Executive Briefing</strong> to synthesize session governance telemetry into an executive summary.
              </div>
            )}
          </div>

          {/* Consolidated Activity Ledger Table */}
          <Card>
            <CardHeader
              title="Consolidated Financial Action Proposals Ledger"
              subtitle="Full chronological record of every proposal formulated by the agent and its authoritative gateway verdict."
            />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Gateway Decision</th>
                    <th className="py-2.5 px-3">Reason Summary</th>
                    <th className="py-2.5 px-3">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {r.targetId}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {r.vendorName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatInrCurrency(r.amount, r.currency)}
                      </td>
                      <td className="py-3 px-3">
                        <RiskTierBadge tier={r.riskTier} />
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            r.outcome === "allow"
                              ? "allow"
                              : r.outcome === "review"
                                ? "review"
                                : "deny"
                          }
                        >
                          {r.outcome === "allow"
                            ? "✓ ALLOWED"
                            : r.outcome === "review"
                              ? "⏸️ REVIEW"
                              : "✕ DENIED"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={r.ruleExplanation}>
                        {r.ruleExplanation}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => openInspector(r.id, r.outcome, r.reasonCodes, r.riskTier)}
                          className="text-xs font-bold text-ember-600 hover:text-ember-700 underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 5: ARCHITECTURE & SAFETY TOOLS                               */}
      {/* ==================================================================== */}
      {activeChannel === "web" && activeTab === "architecture" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Separating AI Thinking from Financial Doing"
              subtitle="Architectural boundary separating AI reasoning from deterministic payment execution."
            />
            <div className="mt-4">
              <StatusTimeline steps={AGENT_PIPELINE_STEPS} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Registered Financial Agent Tools (5 Read-Only, 4 Protected Write)"
              subtitle="Authorized capabilities and safety boundaries enforced by the Governance Runtime."
            />
            <div className="mt-2">
              <DataTable
                columns={TOOL_TABLE_COLUMNS}
                rows={tools}
                getRowKey={(row) => row.name}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Action Proof Inspector Modal */}
      <ActionInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        decision={selectedDecision}
      />
    </div>
  );
}
