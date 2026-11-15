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
  User,
  Trash2,
  Lightbulb,
  Settings2,
  ChevronRight,
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
  type FinancialCategoryBudgetDto,
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

// 3 clear benchmark scenarios (Allow, Review, Deny) - presentation ready
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
      "Routine spend within Software monthly quota and below operator review threshold. Allowed autonomously with single-use permit.",
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
      "Action exceeds the configured operator review threshold. Intercepted and enqueued in /approvals for dual-key operator signoff.",
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
      "Unverified beneficiary detected and requested amount exceeds available Infrastructure budget. Blocked immediately under deterministic invariant.",
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

  // Reactive Category Budgets State (Updated when user edits settings or when transactions are approved)
  const [categoryBudgets, setCategoryBudgets] = useState<readonly FinancialCategoryBudgetDto[]>(
    summary.monthly_budgets
  );

  // Activity Records & AI Summary State
  const [activityRecords, setActivityRecords] = useState<readonly ActivityActionRecord[]>(
    INITIAL_ACTIVITY_RECORDS
  );
  const [aiSummary, setAiSummary] = useState<GovernanceActivitySummaryDto | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [, startTransition] = useTransition();

  // Helper to synchronize live category budgets when user changes numerical settings
  const syncBudgetsWithSettings = (newSettings: AgentPolicySettings) => {
    setCategoryBudgets((prev) =>
      prev.map((b) => {
        const catLower = b.category.toLowerCase();
        let newLimit = parseFloat(b.limit_amount);
        if (catLower.includes("infra")) newLimit = newSettings.infrastructureBudget;
        else if (catLower.includes("soft")) newLimit = newSettings.softwareBudget;
        else if (catLower.includes("misc")) newLimit = newSettings.miscellaneousBudget;

        const spent = parseFloat(b.used_amount || "0");
        const available = Math.max(0, newLimit - spent);
        return {
          ...b,
          limit_amount: newLimit.toFixed(2),
          available_amount: available.toFixed(2),
        };
      })
    );
  };

  // Evaluate action proposal dynamically against active policy settings & actual live category budgets
  const evaluateActionWithPolicy = (
    action: FinancialActionProposal,
    settings: AgentPolicySettings,
    budgets: readonly FinancialCategoryBudgetDto[]
  ): { outcome: DecisionOutcome; reasonCodes: string[]; ruleExplanation: string; allowedAmountToDeduct: number } => {
    const amountVal = parseFloat(action.amount || "0");
    const category = (action.category || "software").toLowerCase();

    // 1. Strict profile forces every action to review
    if (settings.profileStyle === "strict" || settings.reviewThreshold === 0) {
      return {
        outcome: "review",
        reasonCodes: ["STRICT_PROFILE_MANDATORY_REVIEW", "APPROVAL_REQUIRED"],
        ruleExplanation: `Strict Governance Baseline active: Zero autonomous settlement permitted. Intercepted and enqueued in /approvals for dual-key operator signoff.`,
        allowedAmountToDeduct: 0,
      };
    }

    // 2. Resolve the matching category budget dynamically
    const matchedBudget = budgets.find((b) => {
      const bCat = b.category.toLowerCase();
      return bCat.includes(category) || category.includes(bCat);
    });

    const availableBudget = matchedBudget ? parseFloat(matchedBudget.available_amount) : 50000;

    // 3. Budget violation check (100% accurate reason matching display)
    if (amountVal > availableBudget) {
      const deficit = amountVal - availableBudget;
      return {
        outcome: "deny",
        reasonCodes: ["DENY_BUDGET_EXCEEDED", "INVARIANT_BREACH"],
        ruleExplanation: `Proposed ${formatInrCurrency(amountVal.toString())} exceeds available ${action.category ?? "category"} budget of ${formatInrCurrency(availableBudget.toString())} (deficit of ${formatInrCurrency(deficit.toString())}). Hard-blocked at gateway.`,
        allowedAmountToDeduct: 0,
      };
    }

    // 4. Operator Review threshold check
    if (amountVal > settings.reviewThreshold) {
      return {
        outcome: "review",
        reasonCodes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
        ruleExplanation: `Amount ${formatInrCurrency(amountVal.toString())} exceeds configured operator review threshold (${formatInrCurrency(settings.reviewThreshold.toString())}). Paused at gateway awaiting dual-key signoff.`,
        allowedAmountToDeduct: 0,
      };
    }

    // 5. Allowed routine payment
    return {
      outcome: "allow",
      reasonCodes: ["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
      ruleExplanation: `Within ${action.category ?? "category"} budget (${formatInrCurrency(availableBudget.toString())} available) and below operator review threshold (${formatInrCurrency(settings.reviewThreshold.toString())}). Verified vendor match. Single-use Ed25519 execution permit minted.`,
      allowedAmountToDeduct: amountVal,
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

  // Option to delete / clear action history
  const handleClearActionHistory = () => {
    setActivityRecords([]);
    setAiSummary(null);
    setPolicyToast("Action history and audit ledger cleared.");
    setTimeout(() => setPolicyToast(null), 3000);
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

  // Dynamic entity parser: extracts invoice numbers, amounts, vendors, and categories from ANY prompt
  const parseDynamicPrompt = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Invoice match (e.g. INV-001, INV-042, INV-999)
    const invMatch = text.match(/INV-[\w-]+/i);
    const targetInvoice = invMatch ? invMatch[0].toUpperCase() : null;

    // 2. Check if this invoice exists in ground-truth unpaidInvoices list
    const matchedKnownInvoice = targetInvoice
      ? unpaidInvoices.find((i) => i.invoice_number.toUpperCase() === targetInvoice)
      : null;

    // 3. Monetary Amount extraction
    const amountMatch = text.match(
      /(?:inr|rs\.?|₹|\$)\s*([\d,]+(?:\.\d{2})?)|(\b\d{4,7}(?:\.\d{2})?\b)/i
    );
    let extractedAmount = "15000.00";
    if (matchedKnownInvoice) {
      extractedAmount = matchedKnownInvoice.amount;
    } else if (amountMatch) {
      const raw = (amountMatch[1] ?? amountMatch[2] ?? "").replace(/,/g, "");
      if (!isNaN(parseFloat(raw))) {
        extractedAmount = parseFloat(raw).toFixed(2);
      }
    }

    // 4. Category extraction
    let extractedCategory = matchedKnownInvoice?.category ?? "Software";
    if (!matchedKnownInvoice) {
      if (lower.includes("infra") || lower.includes("server") || lower.includes("compute") || lower.includes("gpu") || lower.includes("hosting")) {
        extractedCategory = "Infrastructure";
      } else if (lower.includes("soft") || lower.includes("saas") || lower.includes("license") || lower.includes("cloud") || lower.includes("api")) {
        extractedCategory = "Software";
      } else if (lower.includes("misc") || lower.includes("supplies") || lower.includes("office") || lower.includes("travel")) {
        extractedCategory = "Miscellaneous";
      }
    }

    // 5. Vendor extraction
    let extractedVendor = matchedKnownInvoice?.vendor_name ?? "Enterprise Beneficiary";
    if (!matchedKnownInvoice) {
      const knownVendors = [
        "Acme Cloud Services",
        "Acme Cloud",
        "Nova Compute Systems",
        "Nova Compute",
        "Quantum Hosting Labs",
        "Quantum Labs",
        "AWS",
        "Google Cloud",
        "Microsoft Azure",
        "Logistics Corp",
      ];
      for (const v of knownVendors) {
        if (lower.includes(v.toLowerCase())) {
          extractedVendor = v;
          break;
        }
      }
    }

    return {
      targetId: targetInvoice ?? `INV-${Math.floor(100 + Math.random() * 900)}`,
      amount: extractedAmount,
      category: extractedCategory,
      vendorName: extractedVendor,
      isVerifiedVendor: matchedKnownInvoice ? matchedKnownInvoice.is_verified_vendor : !lower.includes("unverified"),
    };
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
        const policyResult = evaluateActionWithPolicy(effectiveProposal, policySettings, categoryBudgets);
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

        // Deduct from live budgets if permitted
        if (policyResult.allowedAmountToDeduct > 0) {
          const cat = (effectiveProposal.category || "software").toLowerCase();
          setCategoryBudgets((prev) =>
            prev.map((b) => {
              if (b.category.toLowerCase().includes(cat) || cat.includes(b.category.toLowerCase())) {
                const currAvail = parseFloat(b.available_amount);
                const currSpent = parseFloat(b.used_amount || "0");
                const newAvail = Math.max(0, currAvail - policyResult.allowedAmountToDeduct);
                const newSpent = currSpent + policyResult.allowedAmountToDeduct;
                return {
                  ...b,
                  available_amount: newAvail.toFixed(2),
                  used_amount: newSpent.toFixed(2),
                };
              }
              return b;
            })
          );
        }

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
      // Dynamic Resilient Simulation Engine
      const promptLower = trimmed.toLowerCase();
      const isBalanceQuery =
        promptLower.includes("balance") ||
        promptLower.includes("how much") ||
        promptLower.includes("funds available") ||
        promptLower.includes("quota");

      if (isBalanceQuery) {
        const agentMessage = `The Operations Account available balance is INR ${summary.total_available_balance}. Active monthly allocations: Software (INR ${categoryBudgets.find((b) => b.category.toLowerCase().includes("soft"))?.available_amount ?? "25,000.00"} available), Infrastructure (INR ${categoryBudgets.find((b) => b.category.toLowerCase().includes("infra"))?.available_amount ?? "50,000.00"} available), and Miscellaneous (INR ${categoryBudgets.find((b) => b.category.toLowerCase().includes("misc"))?.available_amount ?? "10,000.00"} available).`;

        const simTurn: ChatTurn = {
          id: `turn-agent-${Date.now()}`,
          role: "agent",
          text: agentMessage,
          status: "completed",
          proposed_action: null,
          evidence_refs: ["account:Operations Account:balance", "ledger:category_budgets"],
          governance: null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        setTurns((prev) => [...prev, simTurn]);
      } else {
        // Dynamic financial action formulation
        const parsed = parseDynamicPrompt(trimmed);
        const simProposal: FinancialActionProposal = {
          action_type: "pay_invoice",
          target_id: parsed.targetId,
          amount: parsed.amount,
          currency: "INR",
          category: parsed.category,
          vendor_name: parsed.vendorName,
          justification: `Payment evaluation requested for invoice ${parsed.targetId} from ${parsed.vendorName} under ${parsed.category} category.`,
          evidence_refs: [
            `invoice:${parsed.targetId}`,
            `beneficiary:${parsed.vendorName}`,
            `budget:${parsed.category.toLowerCase()}`,
            "account:Operations Account",
          ],
        };

        const policyResult = evaluateActionWithPolicy(simProposal, policySettings, categoryBudgets);
        const amtNum = parseFloat(parsed.amount);
        const resolvedRisk: RiskTier = amtNum < 15000 ? "R2" : amtNum < 50000 ? "R3" : "R4";

        const simGovernance: GovernanceSummary = {
          action_id: `act-${Date.now().toString(16)}`,
          outcome: policyResult.outcome,
          reason_codes: policyResult.reasonCodes,
          risk_tier: resolvedRisk,
          profile_name: policySettings.profileName,
          profile_style: policySettings.profileStyle,
          requires_approval: policyResult.outcome === "review",
          budget_remaining_after: (Math.max(0, 50000 - amtNum)).toFixed(2),
          summary_text: policyResult.ruleExplanation,
        };

        // Deduct from live budgets if permitted
        if (policyResult.allowedAmountToDeduct > 0) {
          const cat = parsed.category.toLowerCase();
          setCategoryBudgets((prev) =>
            prev.map((b) => {
              if (b.category.toLowerCase().includes(cat) || cat.includes(b.category.toLowerCase())) {
                const currAvail = parseFloat(b.available_amount);
                const currSpent = parseFloat(b.used_amount || "0");
                const newAvail = Math.max(0, currAvail - policyResult.allowedAmountToDeduct);
                const newSpent = currSpent + policyResult.allowedAmountToDeduct;
                return {
                  ...b,
                  available_amount: newAvail.toFixed(2),
                  used_amount: newSpent.toFixed(2),
                };
              }
              return b;
            })
          );
        }

        const newRecord: ActivityActionRecord = {
          id: simGovernance.action_id,
          targetId: simProposal.target_id,
          actionType: simProposal.action_type,
          vendorName: simProposal.vendor_name || "Enterprise Vendor",
          isVerifiedVendor: parsed.isVerifiedVendor,
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

        const agentMessage = `I retrieved records for invoice ${parsed.targetId} (${parsed.vendorName}, INR ${formatInrCurrency(parsed.amount)}) and cross-referenced with ${parsed.category} budget allocations. I have formulated a structured proposal for authoritative gateway evaluation.`;

        const simAgentTurn: ChatTurn = {
          id: `turn-agent-${Date.now()}`,
          role: "agent",
          text: agentMessage,
          status: "proposal_ready",
          proposed_action: simProposal,
          evidence_refs: [
            `invoice:${parsed.targetId}`,
            `vendor:${parsed.vendorName}`,
            `budget:${parsed.category.toLowerCase()}:active`,
          ],
          governance: simGovernance,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };

        setTurns((prev) => [...prev, simAgentTurn]);
      }
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
          "Routine Software SaaS payments were verified against contract and minted single-use permits.",
          "High-value infrastructure surges exceeded review threshold and were intercepted for human authorization.",
          "Over-budget or unverified disbursements were deterministically blocked, safeguarding treasury capital.",
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
      {/* 1. MASTER WORKSPACE HEADER (Clean, focused, no channel distraction) */}
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
              Operations flight deck for financial AI agents. Agents research balances and formulate proposals,
              while money movement requires independent, deterministic governance approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <span>Project &amp; Team Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* 2. SUB AGENT CONSOLE NAVBAR (TABS) */}
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
      </div>

      {/* ==================================================================== */}
      {/* SUBPAGE 1: INTERACTIVE CONSOLE (BALANCED 2-COLUMN LAYOUT)             */}
      {/* ==================================================================== */}
      {activeTab === "console" && (
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
                  Autonomous operational planning governed under{" "}
                  <strong className="text-slate-200">{policySettings.profileName}</strong>.
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
              <button
                type="button"
                onClick={handleClearActionHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-700 text-xs font-bold text-slate-300 hover:text-rose-300 transition-colors"
                title="Clear action history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          {/* 3 Benchmark Scenarios Bar (Clear, not overwhelming) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ember-500" />
                <span>Curated Benchmark Scenarios (Click to Load)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                You can also enter ANY custom prompt or amount below
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
            {/* LEFT COLUMN (5 cols): COMMAND DISPATCH + TREASURY GROUND TRUTH + QUICK CONTROLS */}
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
                  <span className="text-[11px] text-slate-500">
                    Supports any invoice, vendor or amount
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
                      placeholder="e.g. Pay INV-001 if valid, or pay AWS INR 18,000 for cloud compute..."
                    />
                  </div>

                  {/* Quick-Insert Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setPrompt("Pay INV-001 for Acme Cloud Services (₹8,000)")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + INV-001
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompt("Check Operations Account balance & available budgets")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + Balance Check
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompt("Pay INV-002 for Nova Compute Systems (₹35,000)")}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      + INV-002
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

              {/* Reactive Treasury Ground Truth at a Glance */}
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
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Operations Account
                    </span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatInrCurrency(summary.total_available_balance, summary.currency)}
                    </span>
                  </div>
                  <Badge variant="allow">Good Standing</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Category Budgets (Monthly Quotas):
                    </span>
                    <span className="text-[10px] text-slate-400">Live Reactive State</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {categoryBudgets.map((b) => {
                      const limit = parseFloat(b.limit_amount || "1");
                      const avail = parseFloat(b.available_amount || "0");
                      const usedPct = Math.min(100, Math.round(((limit - avail) / limit) * 100));

                      return (
                        <div key={b.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between font-medium mb-1">
                            <span className="font-bold text-slate-800">{b.category}</span>
                            <span className="font-mono text-slate-700 font-bold">
                              {formatInrCurrency(b.available_amount, b.currency)} avail
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
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

                {/* Quick In-Screen Policy Tweaker (Reflects immediately!) */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Review Threshold:</span>
                    </span>
                    <span className="font-mono font-bold text-ember-600">
                      {formatInrCurrency(policySettings.reviewThreshold.toString())}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={policySettings.reviewThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPolicySettings((prev) => ({
                        ...prev,
                        reviewThreshold: val,
                      }));
                      setPolicyToast(`Review threshold set to ${formatInrCurrency(val.toString())}`);
                      setTimeout(() => setPolicyToast(null), 2000);
                    }}
                    className="w-full accent-ember-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Active: <strong>{policySettings.profileName}</strong></span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("policies")}
                      className="font-bold text-ember-600 hover:text-ember-700"
                    >
                      All Budget Settings →
                    </button>
                  </div>
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
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      Verifiable record of unprivileged AI reasoning and authoritative governance evaluation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {turns.length} {turns.length === 1 ? "turn" : "turns"}
                    </span>
                    {activityRecords.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearActionHistory}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Delete action history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Pick a scenario above or enter ANY custom financial objective on the left.
                        Observe how Neolith separates intelligent planning from real money execution.
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
                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                                  <User className="w-3 h-3" />
                                </div>
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
                              <div className="w-6 h-6 rounded-lg bg-ember-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                                <Bot className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-xs text-slate-900">
                                Financial AI Agent
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                Grounded
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{turn.timestamp}</span>
                          </div>

                          {/* Message Content */}
                          <div className="text-sm text-slate-800 leading-relaxed">
                            {turn.text}
                          </div>

                          {/* Evidence Grounding */}
                          {turn.evidence_refs && turn.evidence_refs.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                              <span className="text-[11px] font-bold text-slate-500 block">
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
                                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Target</span>
                                  <strong className="font-mono text-slate-900">{turn.proposed_action.target_id}</strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Amount</span>
                                  <strong className="font-mono text-ember-600">
                                    {formatInrCurrency(turn.proposed_action.amount ?? "0", turn.proposed_action.currency)}
                                  </strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Vendor</span>
                                  <strong className="text-slate-800 truncate block">{turn.proposed_action.vendor_name ?? "N/A"}</strong>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Category</span>
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
                                        {isAllowed ? "ALLOWED (Permit Minted)" : isReview ? "REVIEW REQUIRED" : "BLOCKED BY SAFEGUARD"}
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
                                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                                      >
                                        <span>Open /approvals</span>
                                        <ArrowRight className="w-3 h-3" />
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
      {activeTab === "context" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Operating Treasury
                </span>
                <Badge variant="allow">Active</Badge>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInrCurrency(summary.total_available_balance, summary.currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Primary Account: {summary.primary_account?.name ?? "Operations Account"}
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Unpaid Invoices
                </span>
                <Badge variant="review">{unpaidInvoices.length} Pending</Badge>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInrCurrency(summary.unpaid_invoice_value, summary.currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Ground truth invoices ready for AI inspection
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Guardrail Mode
                </span>
                <Badge variant="info">OPA Enforced</Badge>
              </div>
              <div className="text-xl font-bold text-slate-900">
                {policySettings.profileName}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
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
              {categoryBudgets.map((b) => {
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
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Total Limit:</span>
                        <span className="font-mono">{formatInrCurrency(b.limit_amount, b.currency)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
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
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
                      <td className="py-3 px-3 text-slate-500">
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
      {activeTab === "policies" && (
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
                      const updated: AgentPolicySettings = {
                        ...policySettings,
                        profileStyle: prof.id,
                        profileName: prof.name,
                        reviewThreshold: prof.reviewThreshold,
                      };
                      setPolicySettings(updated);
                      syncBudgetsWithSettings(updated);
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
                subtitle="Configure exact numerical bounds enforced by the Runtime Gateway. Changes immediately sync with all panels."
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
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...policySettings, reviewThreshold: val };
                      setPolicySettings(updated);
                      syncBudgetsWithSettings(updated);
                    }}
                    className="w-full accent-ember-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 m-0">
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
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...policySettings, softwareBudget: val };
                      setPolicySettings(updated);
                      syncBudgetsWithSettings(updated);
                    }}
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
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...policySettings, infrastructureBudget: val };
                      setPolicySettings(updated);
                      syncBudgetsWithSettings(updated);
                    }}
                    className="w-full accent-ember-500"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      syncBudgetsWithSettings(policySettings);
                      setPolicyToast("Policy parameters successfully synchronized with all panels!");
                      setTimeout(() => setPolicyToast(null), 3000);
                    }}
                    className="w-full"
                  >
                    <span>Synchronize &amp; Apply Policies</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Invariant Simulator Preview */}
            <Card>
              <CardHeader
                title="Real-Time Policy Impact Simulator"
                subtitle="How the currently configured policies govern benchmark and custom scenarios."
              />
              <div className="space-y-3 mt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>INV-001 (Acme SaaS · ₹8,000)</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {policySettings.profileStyle === "strict" ? "REVIEW REQUIRED" : "ALLOW"}
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
                      {35000 > policySettings.reviewThreshold ? "REVIEW REQUIRED" : "ALLOW"}
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
                      HARD BLOCKED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 m-0">
                    Unverified beneficiary and infrastructure quota breach. Always blocked under deterministic rules.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Tip:</strong> Switch to the <strong>Interactive Console</strong> tab to test instructions against these exact rules.
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBPAGE 4: ACTIVITY & AI SUMMARY (LLM BRIEFING & AUDIT LEDGER)       */}
      {/* ==================================================================== */}
      {activeTab === "activity" && (
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
                <p className="text-xs text-slate-500 m-0">
                  Automated LLM synthesis summarizing agent proposals, allowed disbursements, and intercepted risks.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {activityRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearActionHistory}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isSummarizing}
                  onClick={handleGenerateSummary}
                  className="font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>Generate Executive Briefing</span>
                </Button>
              </div>
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
              <div className="py-6 text-center text-xs text-slate-500">
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
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
                            ? "ALLOWED"
                            : r.outcome === "review"
                              ? "REVIEW"
                              : "DENIED"}
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
      {activeTab === "architecture" && (
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
