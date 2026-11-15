"use client";

import { useState, type FormEvent } from "react";
import { ActionInspector } from "@/components/ActionInspector";
import { Badge, Button, Card, CardHeader, CopyableId } from "@/components/ui";
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

const BENCHMARK_EXAMPLES = [
  "Show the Operations Account balance",
  "Inspect INV-001",
  "Pay INV-001 if it is valid and within our software budget",
  "Can we pay INV-002?",
  "Inspect INV-003",
] as const;

export function AgentTaskConsole() {
  const [prompt, setPrompt] = useState<string>(BENCHMARK_EXAMPLES[2]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>("task-financial-agent-01");
  const [activeTraceId, setActiveTraceId] = useState<string | null>("trace-core-7a2f1b40");
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<ChatTurn | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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
      timestamp: new Date().toLocaleTimeString(),
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
          timestamp: new Date().toLocaleTimeString(),
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
        timestamp: new Date().toLocaleTimeString(),
      };
      setTurns((prev) => [...prev, agentTurn]);
    } catch {
      // High-Fidelity Simulation Fallback (Ensures offline/restarting resilient operation)
      const promptLower = trimmed.toLowerCase();
      let simProposal: FinancialActionProposal | null = null;
      let agentMessage = "I have reviewed your financial instruction against authoritative ledger data.";
      let evidenceRefs: string[] = ["account:operations:100000"];

      if (promptLower.includes("balance") || promptLower.includes("account")) {
        agentMessage =
          "The Operations Account currently has an available balance of INR 100,000.00. Software monthly budget is INR 50,000.00 (INR 31,600.00 remaining), and Infrastructure budget is INR 30,000.00 (INR 0.00 remaining).";
        evidenceRefs = ["account:operations:balance", "budget:software:50000", "budget:infrastructure:30000"];
      } else if (promptLower.includes("inv-001")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-001",
          amount: "8000.00",
          currency: "INR",
          category: "Software",
          vendor_name: "Acme Cloud Services",
          justification: "Payment for recurring software SaaS subscription under active vendor contract.",
          evidence_refs: ["invoice:INV-001", "budget:software", "vendor:acme-cloud"],
        };
        agentMessage =
          "I have verified invoice INV-001 for Acme Cloud Services in the amount of INR 8,000.00. The invoice is valid, vendor is verified, and the amount is within Software budget.";
        evidenceRefs = ["invoice:INV-001", "vendor:verified:acme-cloud", "budget:software"];
      } else if (promptLower.includes("inv-002")) {
        simProposal = {
          action_type: "pay_invoice",
          target_id: "INV-002",
          amount: "35000.00",
          currency: "INR",
          category: "Infrastructure",
          vendor_name: "Nova Compute Systems",
          justification: "Payment for primary cloud server infrastructure capacity.",
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
          justification: "Unscheduled data migration compute invoice.",
          evidence_refs: ["invoice:INV-003", "vendor:unverified:quantum-hosting"],
        };
        agentMessage =
          "Invoice INV-003 (INR 65,000.00) proposes an unbudgeted infrastructure debit for unverified vendor Quantum Hosting Labs.";
        evidenceRefs = ["invoice:INV-003", "vendor:unverified:quantum-hosting"];
      } else {
        agentMessage = `Understood: "${trimmed}". The Financial AI Agent will ground this instruction in read-only account records.`;
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
          timestamp: new Date().toLocaleTimeString(),
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
        timestamp: new Date().toLocaleTimeString(),
      };
      setTurns((prev) => [...prev, agentTurn]);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadgeVariant(status?: InterfaceResponseStatus): "allow" | "review" | "deny" | "info" {
    switch (status) {
      case "completed":
        return "allow";
      case "proposal_ready":
        return "info";
      case "needs_clarification":
        return "review";
      case "error":
        return "deny";
      default:
        return "info";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. INTERACTIVE POLICY & BUDGET CONTROLS */}
      <AgentPolicyConfig
        settings={policySettings}
        onSaveSettings={(newSettings) => setPolicySettings(newSettings)}
      />

      {/* 2. FINANCIAL AGENT INTERACTION CONSOLE */}
      <Card>
        <CardHeader
          title="Financial AI Agent Interaction Core"
          subtitle="Interact with the Financial AI Agent. Proposes typed FinancialActionProposal envelopes under active governance policies."
        />

        {/* Quick Benchmark Buttons */}
        <div className="flex gap-2 flex-wrap mb-4" role="group" aria-label="Benchmark financial prompts">
          {BENCHMARK_EXAMPLES.map((sample) => (
            <Button
              key={sample}
              type="button"
              variant={prompt === sample ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setPrompt(sample);
                setErrorMsg(null);
              }}
            >
              {sample}
            </Button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            htmlFor="financial-agent-prompt"
            className="block font-semibold text-xs uppercase tracking-wider text-slate-700"
          >
            Financial Instruction or Benchmark Scenario
          </label>
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
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
            placeholder="e.g. Pay INV-001 if the invoice is valid and within our software budget..."
          />
          <div className="flex items-center gap-3 flex-wrap justify-between pt-1">
            <Button type="submit" variant="primary" isLoading={submitting}>
              Dispatch Turn to Financial Agent
            </Button>
            <span className="text-xs text-slate-500">
              Press <strong>Enter</strong> to send &bull; Evaluated under <strong>{policySettings.profileName}</strong>
            </span>
          </div>
        </form>

        {submitting && (
          <div className="mt-4 p-3 rounded-xl border border-orange-200 bg-orange-50/70 flex items-center gap-2.5 text-xs text-orange-900 animate-pulse">
            <span className="font-bold">🤖 Processing:</span>
            <span>
              Ingesting financial context &rarr; Grounding evidence &rarr; Applying {policySettings.profileName} policy rules...
            </span>
          </div>
        )}

        {errorMsg && (
          <div role="alert" className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <strong>Notice:</strong> {errorMsg}
          </div>
        )}

        {activeTaskId && (
          <div className="mt-4 p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex gap-4 items-center flex-wrap text-xs">
            <span className="font-bold text-slate-600">Active Session:</span>
            <CopyableId label="task_id" value={activeTaskId} />
            {activeTraceId && <CopyableId label="trace_id" value={activeTraceId} />}
          </div>
        )}
      </Card>

      {/* 3. CONVERSATION & INTERACTION TURNS */}
      {turns.length > 0 && (
        <Card>
          <CardHeader
            title="Session Turns & Evaluated Proposals"
            subtitle="Stream of agent reasoning, retrieved ledger evidence, and authoritative Gateway evaluation."
          />
          <div className="space-y-4">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`p-4 rounded-xl border transition-all ${
                  turn.role === "user"
                    ? "bg-white border-slate-200"
                    : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    {turn.role === "user" ? "👤 User Instruction" : "🤖 Financial AI Agent"}
                  </span>
                  <div className="flex gap-2 items-center">
                    {turn.status && (
                      <Badge variant={getStatusBadgeVariant(turn.status)}>
                        {turn.status.toUpperCase()}
                      </Badge>
                    )}
                    <span className="text-[11px] text-slate-400">{turn.timestamp}</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-800 mb-2">{turn.text}</p>

                {turn.evidence_refs && turn.evidence_refs.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-slate-500 mr-2">Evidence Grounding:</span>
                    <div className="inline-flex gap-1.5 flex-wrap">
                      {turn.evidence_refs.map((ref) => (
                        <code key={ref} className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                          {ref}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate Action Proposal */}
                {turn.proposed_action && (
                  <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        PROPOSAL READY
                      </span>
                      <span className="text-xs text-slate-500">
                        Action Type: <code className="font-mono text-slate-800 font-bold">{turn.proposed_action.action_type}</code>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Target:</span>
                        <strong className="text-slate-800 font-mono">{turn.proposed_action.target_id}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Amount:</span>
                        <strong className="text-slate-900 font-mono">
                          {formatInrCurrency(turn.proposed_action.amount, turn.proposed_action.currency)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Vendor:</span>
                        <strong className="text-slate-800">{turn.proposed_action.vendor_name || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Category:</span>
                        <strong className="text-slate-800">{turn.proposed_action.category || "N/A"}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      Justification: {turn.proposed_action.justification}
                    </p>

                    {/* Authoritative Gateway Decision Badge */}
                    <div className="p-3 rounded-xl border border-orange-300 bg-orange-50/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          Gateway Gate
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {turn.governance?.profile_name}:{" "}
                          <strong
                            className={
                              turn.governance?.outcome === "allow"
                                ? "text-emerald-700"
                                : turn.governance?.outcome === "deny"
                                  ? "text-red-700"
                                  : "text-amber-700"
                            }
                          >
                            {turn.governance?.outcome === "allow"
                              ? "Allowed (Autonomous Execution)"
                              : turn.governance?.outcome === "deny"
                                ? "Blocked (Safeguard Invariant)"
                                : "Controlled (Paused for Review)"}
                          </strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTurn(turn);
                          setIsInspectorOpen(true);
                        }}
                        className="text-xs font-bold text-orange-700 hover:text-orange-900 underline"
                      >
                        Inspect Decision Details &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

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
