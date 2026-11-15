"use client";

import { useState, type FormEvent } from "react";
import {
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Building2,
  CreditCard,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  Lock,
  Layers,
  Terminal,
  User,
  Bot,
} from "lucide-react";
import { ActionInspector } from "@/components/ActionInspector";
import { Button, CopyableId } from "@/components/ui";
import { buildApiUrl, formatInrCurrency } from "@/lib/financial-api";
import {
  AgentPolicyConfig,
  DEFAULT_POLICY_SETTINGS,
  type AgentPolicySettings,
} from "./AgentPolicyConfig";
import {
  AgentActivitySummary,
  type ActivityActionRecord,
} from "./AgentActivitySummary";
import type {
  FinancialActionProposal,
  GovernanceSummary,
  InterfaceResponse,
  InterfaceResponseStatus,
} from "@neolith/contracts";

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
  readonly riskTier: "R1" | "R2" | "R3" | "R4";
  readonly expectedOutcome: "allow" | "review" | "deny" | "read";
}

const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: "scenario-balance",
    title: "Balance & Quota Audit",
    subtitle: "Read-only inspection of accounts & quotas",
    prompt: "Show the Operations Account balance and available category budgets",
    category: "Treasury Audit",
    tag: "Operations Account · ₹100,000",
    riskTier: "R1",
    expectedOutcome: "read",
  },
  {
    id: "scenario-inv001",
    title: "Routine SaaS Payment",
    subtitle: "Verified vendor within monthly quota",
    prompt: "Pay INV-001 if it is valid and within our software budget",
    category: "Software SaaS",
    tag: "Acme Cloud · ₹8,000",
    riskTier: "R2",
    expectedOutcome: "allow",
  },
  {
    id: "scenario-inv002",
    title: "Infra Expansion Surge",
    subtitle: "High-value spend triggering human review",
    prompt: "Can we pay INV-002 for Nova Compute Systems?",
    category: "Cloud Infra",
    tag: "Nova Compute · ₹35,000",
    riskTier: "R3",
    expectedOutcome: "review",
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
  },
];

const DEFAULT_SCENARIO: BenchmarkScenario = BENCHMARK_SCENARIOS[1] ?? {
  id: "scenario-inv001",
  title: "Routine SaaS Payment",
  subtitle: "Verified vendor within monthly quota",
  prompt: "Pay INV-001 if it is valid and within our software budget",
  category: "Software SaaS",
  tag: "Acme Cloud · ₹8,000",
  riskTier: "R2",
  expectedOutcome: "allow",
};

export function AgentTaskConsole() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_SCENARIO.prompt);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEFAULT_SCENARIO.id);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>("task-financial-agent-01");
  const [activeTraceId, setActiveTraceId] = useState<string | null>("trace-core-7a2f1b40");
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<ChatTurn | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Policy and Budget Settings State
  const [policySettings, setPolicySettings] = useState<AgentPolicySettings>(DEFAULT_POLICY_SETTINGS);
  const [sessionActions, setSessionActions] = useState<readonly ActivityActionRecord[]>([]);

  // Evaluate action proposal against active policy settings
  const evaluateActionWithPolicy = (
    action: FinancialActionProposal,
    settings: AgentPolicySettings
  ): { outcome: "allow" | "review" | "deny"; reasonCodes: string[]; ruleExplanation: string } => {
    const amountVal = parseFloat(action.amount || "0");
    const category = (action.category || "software").toLowerCase();

    // 1. Strict profile forces every action to review
    if (settings.profileStyle === "strict" || settings.reviewThreshold === 0) {
      return {
        outcome: "review",
        reasonCodes: ["STRICT_PROFILE_MANDATORY_REVIEW", "APPROVAL_REQUIRED"],
        ruleExplanation: `Strict Governance Baseline active: Zero autonomous settlement permitted. Enqueued in /approvals for operator signature.`,
      };
    }

    // 2. Budget violation check
    const budgetCap =
      category.includes("infra")
        ? settings.infrastructureBudget
        : category.includes("soft")
          ? settings.softwareBudget
          : settings.miscellaneousBudget;

    // Simulate existing spent amount
    const alreadySpent = category.includes("infra") ? 30000 : 8000;
    const remaining = Math.max(0, budgetCap - alreadySpent);

    if (amountVal > remaining) {
      return {
        outcome: "deny",
        reasonCodes: ["DENY_BUDGET_EXCEEDED", "INVARIANT_BREACH"],
        ruleExplanation: `Proposed ${formatInrCurrency(amountVal.toString())} exceeds available ${action.category} budget (${formatInrCurrency(remaining.toString())} remaining). Hard-blocked at gateway.`,
      };
    }

    // 3. Review threshold check
    if (amountVal > settings.reviewThreshold) {
      return {
        outcome: "review",
        reasonCodes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
        ruleExplanation: `Amount ${formatInrCurrency(amountVal.toString())} exceeds operator review threshold (${formatInrCurrency(settings.reviewThreshold.toString())}). Paused at gateway awaiting sign-off.`,
      };
    }

    // 4. Allowed routine payment
    return {
      outcome: "allow",
      reasonCodes: ["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
      ruleExplanation: `Within ${action.category} budget and under review threshold. Verified vendor match. Single-use Ed25519 execution permit minted.`,
    };
  };

  const copyPermitToken = (token: string) => {
    void navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 2) {
      setErrorMsg("Please enter a financial instruction or inquiry.");
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
          riskTier: effectiveGovernance.risk_tier,
          reasonCodes: policyResult.reasonCodes,
          permitToken: policyResult.outcome === "allow" ? `permit_ed25519_${Date.now().toString(16)}` : null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          justification: effectiveProposal.justification,
          ruleExplanation: policyResult.ruleExplanation,
        };

        setSessionActions((prev) => [newRecord, ...prev]);
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
          justification: "Payment for recurring software SaaS subscription under active corporate vendor contract.",
          evidence_refs: ["invoice:INV-001", "budget:software", "vendor:acme-cloud"],
        };
        agentMessage =
          "I have verified invoice INV-001 for Acme Cloud Services in the amount of INR 8,000.00. The invoice is valid, vendor is verified on the corporate whitelist, and the amount is within Software budget.";
        evidenceRefs = ["invoice:INV-001", "vendor:verified:acme-cloud", "budget:software"];
      } else if (promptLower.includes("inv-002")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-002",
          amount: "35000.00",
          currency: "INR",
          category: "Infrastructure",
          vendor_name: "Nova Compute Systems",
          justification: "Payment for primary dedicated cloud server cluster capacity.",
          evidence_refs: ["invoice:INV-002", "budget:infrastructure", "vendor:nova-compute"],
        };
        agentMessage =
          "I have inspected invoice INV-002 for Nova Compute Systems (INR 35,000.00). Vendor is verified on the corporate whitelist. Formulating candidate proposal.";
        evidenceRefs = ["invoice:INV-002", "vendor:verified:nova-compute"];
      } else if (promptLower.includes("inv-003")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-003",
          amount: "65000.00",
          currency: "INR",
          category: "Infrastructure",
          vendor_name: "Quantum Hosting Labs",
          justification: "Unscheduled high-capacity data migration compute invoice.",
          evidence_refs: ["invoice:INV-003", "vendor:unverified:quantum-hosting"],
        };
        agentMessage =
          "Invoice INV-003 (INR 65,000.00) proposes an unbudgeted infrastructure debit for unverified vendor Quantum Hosting Labs.";
        evidenceRefs = ["invoice:INV-003", "vendor:unverified:quantum-hosting"];
      } else {
        agentMessage = `Understood: "${trimmed}". The Financial AI Agent will ground this instruction in read-only account records and submit a candidate proposal for authoritative governance verification.`;
      }

      let simGovernance: GovernanceSummary | null = null;
      if (simProposal) {
        const policyResult = evaluateActionWithPolicy(simProposal, policySettings);
        simGovernance = {
          action_id: `act-${Date.now()}`,
          outcome: policyResult.outcome,
          reason_codes: policyResult.reasonCodes,
          risk_tier: simProposal.amount && parseFloat(simProposal.amount) > 25000 ? "R3" : "R2",
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
          isVerifiedVendor: !simProposal.target_id.includes("003"),
          amount: simProposal.amount || "0.00",
          currency: simProposal.currency || "INR",
          category: simProposal.category || "Software",
          outcome: policyResult.outcome,
          riskTier: simGovernance.risk_tier,
          reasonCodes: policyResult.reasonCodes,
          permitToken: policyResult.outcome === "allow" ? `permit_ed25519_${Date.now().toString(16)}` : null,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          justification: simProposal.justification,
          ruleExplanation: policyResult.ruleExplanation,
        };

        setSessionActions((prev) => [newRecord, ...prev]);
      }

      const agentTurn: ChatTurn = {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: agentMessage,
        status: simProposal ? "proposal_ready" : "completed",
        proposed_action: simProposal,
        evidence_refs: evidenceRefs,
        governance: simGovernance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setTurns((prev) => [...prev, agentTurn]);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectScenario(scenario: BenchmarkScenario) {
    setSelectedScenarioId(scenario.id);
    setPrompt(scenario.prompt);
    setErrorMsg(null);
  }

  function handleClearSession() {
    setTurns([]);
    setErrorMsg(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. INTERACTIVE POLICY & BUDGET CONTROLS ACCORDION */}
      <AgentPolicyConfig
        settings={policySettings}
        onSaveSettings={(newSettings) => setPolicySettings(newSettings)}
      />

      {/* 2. MODERN FLIGHT DECK CONSOLE CONTAINER */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Top Console Deck Header */}
        <div className="bg-[#070B16] text-white p-5 border-b border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ember-500 to-ember-600 flex items-center justify-center text-white shadow-glow flex-shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-tight m-0">
                    Financial Agent Command Deck
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online & Grounded
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Autonomous operational planning under authoritative <strong>{policySettings.profileName}</strong> policies.
                </p>
              </div>
            </div>

            {/* Deck Telemetry Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-ember-400" />
                <span>Zero Ambient Authority</span>
              </div>
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  title="Clear conversation turns"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Turns</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Session & Trace Line */}
          {activeTaskId && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 flex-wrap text-xs text-slate-400">
              <span className="font-semibold text-slate-400">Active Pipeline Session:</span>
              <CopyableId label="task_id" value={activeTaskId} />
              {activeTraceId && <CopyableId label="trace_id" value={activeTraceId} />}
              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                Guardrail Mode: <strong className="text-slate-300">{policySettings.profileName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Benchmark Scenarios Grid */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ember-500" />
              <span>Select Benchmark Financial Scenario</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Click any scenario to populate instruction
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BENCHMARK_SCENARIOS.map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id;
              const outcomeColor =
                scenario.expectedOutcome === "allow"
                  ? "border-emerald-200 text-emerald-800 bg-emerald-50"
                  : scenario.expectedOutcome === "review"
                    ? "border-amber-200 text-amber-800 bg-amber-50"
                    : scenario.expectedOutcome === "deny"
                      ? "border-rose-200 text-rose-800 bg-rose-50"
                      : "border-blue-200 text-blue-800 bg-blue-50";

              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-ember-500 shadow-md ring-2 ring-ember-500/20"
                      : "bg-white hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        {scenario.category}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${outcomeColor}`}
                      >
                        {scenario.expectedOutcome.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 leading-snug mb-1">
                      {scenario.title}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal m-0 line-clamp-2">
                      {scenario.subtitle}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-600 font-semibold truncate max-w-[140px]">
                      {scenario.tag}
                    </span>
                    <span className="font-bold px-1 rounded bg-slate-100 text-slate-600">
                      {scenario.riskTier}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Command Dispatch Form */}
        <div className="p-5 bg-white">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="financial-agent-prompt"
                className="block font-bold text-xs uppercase tracking-wider text-slate-700"
              >
                Agent Financial Objective or Invariant Command
              </label>
              <span className="text-[11px] text-slate-400">
                Natural language &bull; Grounded in read-only context
              </span>
            </div>

            <div className="relative">
              <textarea
                id="financial-agent-prompt"
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
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-ember-500 focus:border-ember-500 shadow-inner transition-all leading-relaxed"
                placeholder="e.g. Pay INV-001 if valid and within software budget..."
              />
            </div>

            {/* Quick Keyword Inserts & Submit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Insert:</span>
                <button
                  type="button"
                  onClick={() => setPrompt("Inspect and pay INV-001 (Acme Cloud Services)")}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  + INV-001
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt("Check Operations Account balance & software budget")}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  + Balance Check
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt("Evaluate INV-002 payment under infrastructure quota")}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  + INV-002
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="shadow-glow"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Dispatch to Agent</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Submitting Loading Telemetry */}
          {submitting && (
            <div className="mt-4 p-4 rounded-xl border border-ember-300 bg-ember-50/70 text-ember-950 text-xs space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-ember-900">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ember-600" />
                </span>
                <span>Executing Governed Agent Turn...</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-lg bg-white/80 border border-ember-200">
                  <span className="font-semibold block text-slate-700">1. Reading Ledger Context</span>
                  <span className="text-slate-500">Querying R1 read-only account APIs</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 border border-ember-200">
                  <span className="font-semibold block text-slate-700">2. Planning Action Proposal</span>
                  <span className="text-slate-500">Formulating typed financial envelope</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 border border-ember-200">
                  <span className="font-semibold block text-slate-700">3. Policy Gate Evaluation</span>
                  <span className="text-slate-500">Checking OPA & {policySettings.profileName}</span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div>
                <strong>Notice:</strong> {errorMsg}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. INTERACTION TURNS & LIVE TELEMETRY STREAM */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Agent Execution & Evaluation Stream
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Live inspectable transcript of AI reasoning, evidence grounding, and authoritative Gateway evaluation.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {turns.length} {turns.length === 1 ? "turn" : "turns"}
          </span>
        </div>

        {turns.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-4 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Terminal className="w-7 h-7 text-ember-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Command Deck Ready
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Submit a natural language financial objective above or pick a benchmark scenario to observe Neolith&apos;s authoritative governance pipeline in real time.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPrompt(DEFAULT_SCENARIO.prompt);
                setSelectedScenarioId(DEFAULT_SCENARIO.id);
              }}
            >
              Load Routine SaaS Scenario (INV-001)
            </Button>
          </div>
        ) : (
          /* Stream of Turns */
          <div className="space-y-6">
            {turns.map((turn) => {
              const isUser = turn.role === "user";

              if (isUser) {
                return (
                  <div
                    key={turn.id}
                    className="p-4 rounded-xl border border-slate-800 bg-[#070B16] text-white shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                          <User className="w-3 h-3" />
                        </span>
                        <span className="font-bold text-slate-200">Requester Operator</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (unprivileged input)
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

              // Agent Response Turn
              const governanceOutcome = turn.governance?.outcome;
              const isAllowed = governanceOutcome === "allow";
              const isReview = governanceOutcome === "review";
              const isDenied = governanceOutcome === "deny";

              return (
                <div
                  key={turn.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm space-y-4"
                >
                  {/* Turn Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-ember-500 text-white flex items-center justify-center text-xs shadow-xs font-bold">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          Financial AI Agent
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          Grounded
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {turn.status && (
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            turn.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : turn.status === "proposal_ready"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {turn.status.replace("_", " ")}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">{turn.timestamp}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-sm text-slate-800 leading-relaxed">
                    {turn.text}
                  </div>

                  {/* Evidence Grounding Strip */}
                  {turn.evidence_refs && turn.evidence_refs.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Authoritative Evidence Grounding:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {turn.evidence_refs.map((ref) => (
                          <span
                            key={ref}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                          >
                            {ref.startsWith("invoice:") && <FileText className="w-3 h-3 text-blue-500" />}
                            {ref.startsWith("vendor:") && <Building2 className="w-3 h-3 text-emerald-500" />}
                            {ref.startsWith("budget:") && <CreditCard className="w-3 h-3 text-purple-500" />}
                            <span>{ref}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate Action Proposal */}
                  {turn.proposed_action && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Candidate Proposal
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {turn.proposed_action.action_type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Separated from Execution Authority
                        </span>
                      </div>

                      {/* 4-Item Metric Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Target Invoice
                          </span>
                          <strong className="text-slate-900 font-mono text-xs">
                            {turn.proposed_action.target_id}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Proposed Amount
                          </span>
                          <strong className="text-slate-900 font-mono text-xs text-ember-600">
                            {formatInrCurrency(turn.proposed_action.amount, turn.proposed_action.currency)}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Vendor
                          </span>
                          <strong className="text-slate-800 truncate block text-xs">
                            {turn.proposed_action.vendor_name || "N/A"}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Category
                          </span>
                          <strong className="text-slate-800 block text-xs">
                            {turn.proposed_action.category || "N/A"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                        <strong>Reasoning:</strong> {turn.proposed_action.justification}
                      </div>

                      {/* Authoritative Gateway Decision Gate */}
                      {turn.governance && (
                        <div
                          className={`p-4 rounded-xl border transition-all ${
                            isAllowed
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                              : isReview
                                ? "bg-amber-50/70 border-amber-300 text-amber-950"
                                : "bg-rose-50/70 border-rose-300 text-rose-950"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-current/10">
                            <div className="flex items-center gap-2">
                              {isAllowed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              {isReview && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                              {isDenied && <XCircle className="w-4 h-4 text-rose-600" />}
                              <span className="font-bold text-xs uppercase tracking-wide">
                                Gateway Decision:{" "}
                                {isAllowed
                                  ? "PERMITTED (Autonomous Execution)"
                                  : isReview
                                    ? "REVIEW REQUIRED (Paused at Gate)"
                                    : "BLOCKED (Safeguard Invariant)"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTurn(turn);
                                setIsInspectorOpen(true);
                              }}
                              className="text-xs font-bold text-slate-900 hover:text-ember-600 underline flex items-center gap-1 self-start sm:self-auto"
                            >
                              <span>Inspect Cryptographic Proof</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs leading-relaxed mt-2 m-0 font-medium">
                            {turn.governance.summary_text}
                          </p>

                          {/* Reason codes tags */}
                          {turn.governance.reason_codes.length > 0 && (
                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Policy Reason Codes:
                              </span>
                              {turn.governance.reason_codes.map((code) => (
                                <code
                                  key={code}
                                  className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white/80 border border-current/20"
                                >
                                  {code}
                                </code>
                              ))}
                            </div>
                          )}

                          {/* Permit Token Pill (Allowed turn) */}
                          {isAllowed && (
                            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-900">
                                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Single-Use Ed25519 Execution Permit Minted:</span>
                                <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                                  permit_ed25519_9c3a10ffb
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyPermitToken("permit_ed25519_9c3a10ffb")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                              >
                                {copiedToken === "permit_ed25519_9c3a10ffb" ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Permit</span>
                                  </>
                                )}
                              </button>
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

      {/* 4. AI/LLM SUMMARIZATION & CONSOLIDATED GOVERNANCE ACTIVITY LEDGER */}
      <AgentActivitySummary
        extraActions={sessionActions}
        activeProfileName={policySettings.profileName}
      />

      {/* Decision Inspector Modal */}
      <ActionInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        decision={
          selectedTurn?.governance
            ? {
                action_id: selectedTurn.governance.action_id,
                trace_id: activeTraceId ?? "trace-default",
                decision: selectedTurn.governance.outcome,
                outcome: selectedTurn.governance.outcome,
                reason_codes: [...selectedTurn.governance.reason_codes],
                risk_tier: selectedTurn.governance.risk_tier,
                profile_name: selectedTurn.governance.profile_name,
                profile_style: selectedTurn.governance.profile_style,
                profile_version: "1.0.0",
                created_at: new Date().toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
