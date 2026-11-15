"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  FileCode,
  Layers,
  Clock,
} from "lucide-react";
import { formatInrCurrency } from "@/lib/financial-api";
import { ActionInspector } from "@/components/ActionInspector";

export interface ActivityActionRecord {
  readonly id: string;
  readonly targetId: string;
  readonly actionType: string;
  readonly vendorName: string;
  readonly isVerifiedVendor: boolean;
  readonly amount: string;
  readonly currency: string;
  readonly category: string;
  readonly outcome: "allow" | "review" | "deny";
  readonly riskTier: string;
  readonly reasonCodes: readonly string[];
  readonly permitToken?: string | null;
  readonly timestamp: string;
  readonly justification: string;
  readonly ruleExplanation: string;
}

export const BASELINE_ACTIVITY_ACTIONS: readonly ActivityActionRecord[] = [
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
    timestamp: "Just now",
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
    timestamp: "2 mins ago",
    justification: "Payment for dedicated server infrastructure cluster.",
    ruleExplanation:
      "Action exceeds the configured INR 25,000 operator review threshold. Execution was intercepted and enqueued in /approvals for human operator dual-key signoff.",
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
    reasonCodes: ["DENY_BUDGET_EXCEEDED", "UNVERIFIED_BENEFICIARY"],
    permitToken: null,
    timestamp: "5 mins ago",
    justification: "Unscheduled data warehouse migration fee.",
    ruleExplanation:
      "Violates invariant INV-003: Proposed INR 65,000 exceeds available Infrastructure budget (INR 0.00 remaining) and vendor is unverified. Hard-blocked at gateway.",
  },
];

interface AgentActivitySummaryProps {
  readonly extraActions?: readonly ActivityActionRecord[];
  readonly activeProfileName?: string;
}

export function AgentActivitySummary({
  extraActions = [],
  activeProfileName = "Balanced Control",
}: AgentActivitySummaryProps) {
  const allActions = [...extraActions, ...BASELINE_ACTIVITY_ACTIONS];
  const [activeTab, setActiveTab] = useState<"all" | "allow" | "review" | "deny">("all");
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [selectedActionForInspect, setSelectedActionForInspect] = useState<ActivityActionRecord | null>(null);

  // Compute Telemetry Aggregates
  const totalProposedAmount = allActions.reduce(
    (acc, act) => acc + (parseFloat(act.amount) || 0),
    0
  );

  const allowedActions = allActions.filter((a) => a.outcome === "allow");
  const controlledActions = allActions.filter((a) => a.outcome === "review");
  const blockedActions = allActions.filter((a) => a.outcome === "deny");

  const allowedTotal = allowedActions.reduce((acc, act) => acc + (parseFloat(act.amount) || 0), 0);
  const controlledTotal = controlledActions.reduce((acc, act) => acc + (parseFloat(act.amount) || 0), 0);
  const blockedTotal = blockedActions.reduce((acc, act) => acc + (parseFloat(act.amount) || 0), 0);

  const filteredActions = allActions.filter((a) => {
    if (activeTab === "all") return true;
    return a.outcome === activeTab;
  });

  const handleReanalyze = () => {
    setIsReanalyzing(true);
    setTimeout(() => {
      setIsReanalyzing(false);
    }, 900);
  };

  return (
    <div className="space-y-6 mt-8">
      {/* 1. AI / LLM EXECUTIVE BRIEF BOX */}
      <div className="rounded-2xl border border-slate-800 bg-[#070B16] p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background ambient gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>AI Financial Governance Brief</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-orange-300 border border-slate-700">
                    Audit Engine Synthesis
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time architectural assessment of Financial AI Agent activity under{" "}
                  <strong className="text-slate-200">{activeProfileName}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReanalyzing ? "animate-spin text-orange-400" : ""}`} />
              <span>{isReanalyzing ? "Synthesizing Session..." : "Re-analyze Session"}</span>
            </button>
          </div>

          {/* Natural Language Synthesis Narrative */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-300 space-y-2 font-sans">
            <p>
              <strong>Session Overview:</strong> The Financial AI Agent evaluated{" "}
              <strong className="text-white">{allActions.length} financial actions</strong> proposing a cumulative volume of{" "}
              <strong className="text-white">{formatInrCurrency(totalProposedAmount.toString())}</strong>. Neolith&apos;s Zero-Trust
              Governance Gateway intercepted 100% of candidate operations, preventing any ambient authority or unverified debit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                <div className="font-bold flex items-center gap-1 text-emerald-400 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Allowed: {allowedActions.length} Actions ({formatInrCurrency(allowedTotal.toString())})</span>
                </div>
                <span>
                  Validated against verified vendor whitelist and category budget caps. Minted 60-second Ed25519 single-use execution permits for settlement.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200">
                <div className="font-bold flex items-center gap-1 text-amber-400 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Controlled: {controlledActions.length} In Review ({formatInrCurrency(controlledTotal.toString())})</span>
                </div>
                <span>
                  High-value transactions exceeded review threshold or R3 classification. Execution was paused and enqueued in human approvals queue.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200">
                <div className="font-bold flex items-center gap-1 text-red-400 mb-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Blocked: {blockedActions.length} Safeguarded ({formatInrCurrency(blockedTotal.toString())})</span>
                </div>
                <span>
                  Deterministic OPA invariants intercepted unbudgeted spend and unverified beneficiaries. Zero financial leakage permitted.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              <strong>Zero-Trust Guarantee:</strong> The Financial AI Agent possesses zero native payment authority. Every transaction requires an authoritative, cryptographically signed permit from the Neolith Governance Runtime.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CONSOLIDATED TELEMETRY METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Proposed */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Proposed
          </div>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
            {formatInrCurrency(totalProposedAmount.toString())}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {allActions.length} candidate action{allActions.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Auto-Settled */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Auto-Settled (Allowed)
          </div>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5 font-mono">
            {formatInrCurrency(allowedTotal.toString())}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {allowedActions.length} permitted under policy
          </div>
        </div>

        {/* Controlled in Review */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Controlled (In Review)
          </div>
          <div className="text-lg font-extrabold text-amber-700 mt-0.5 font-mono">
            {formatInrCurrency(controlledTotal.toString())}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            {controlledActions.length} held in /approvals queue
          </div>
        </div>

        {/* Blocked / Capital Preserved */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-800">
            Safeguarded (Blocked)
          </div>
          <div className="text-lg font-extrabold text-red-700 mt-0.5 font-mono">
            {formatInrCurrency(blockedTotal.toString())}
          </div>
          <div className="text-[10px] text-red-600 mt-0.5">
            {blockedActions.length} policy invariant denials
          </div>
        </div>
      </div>

      {/* 3. UNIFIED ACTION ACTIVITY LEDGER */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Governance Activity Ledger
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All ({allActions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("allow")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeTab === "allow"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Allowed ({allowedActions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("review")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeTab === "review"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-amber-800 hover:bg-amber-50"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Controlled ({controlledActions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deny")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeTab === "deny"
                  ? "bg-red-700 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-red-800 hover:bg-red-50"
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Blocked ({blockedActions.length})</span>
            </button>
          </div>
        </div>

        {/* Ledger Entries List */}
        <div className="divide-y divide-slate-100">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No actions found in this classification category.
            </div>
          ) : (
            filteredActions.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5">
                {/* Entry Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Outcome Badge */}
                    {act.outcome === "allow" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ALLOWED (AUTO-SETTLED)
                      </span>
                    )}
                    {act.outcome === "review" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        CONTROLLED (HUMAN REVIEW)
                      </span>
                    )}
                    {act.outcome === "deny" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        BLOCKED (SAFEGUARD ENFORCED)
                      </span>
                    )}

                    <strong className="text-xs font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {act.targetId}
                    </strong>

                    <span className="text-xs text-slate-500">
                      ({act.actionType})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      {formatInrCurrency(act.amount, act.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Tier {act.riskTier}
                    </span>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400">Vendor:</span>{" "}
                    <strong className="text-slate-800">{act.vendorName}</strong>{" "}
                    <span className={act.isVerifiedVendor ? "text-emerald-700 text-[10px]" : "text-amber-700 text-[10px]"}>
                      ({act.isVerifiedVendor ? "Verified" : "Unverified"})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400">Category:</span>{" "}
                    <strong className="text-slate-800">{act.category}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400">Reason Codes:</span>{" "}
                    <span className="font-mono text-[10px] text-slate-700">
                      {act.reasonCodes.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Settlement / Gateway Governance Note */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="text-slate-600 text-[11px] leading-snug">
                    <strong className="text-slate-700">Gateway Status:</strong> {act.ruleExplanation}
                  </div>

                  <div className="flex items-center gap-2">
                    {act.outcome === "review" && (
                      <Link
                        href="/approvals"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                      >
                        <span>Open in Approvals Queue</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedActionForInspect(act)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors"
                    >
                      <FileCode className="w-3 h-3 text-slate-400" />
                      <span>Inspect JSON Envelope</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JSON Inspector Modal */}
      <ActionInspector
        isOpen={Boolean(selectedActionForInspect)}
        onClose={() => setSelectedActionForInspect(null)}
        decision={
          selectedActionForInspect
            ? {
                action_id: selectedActionForInspect.id,
                trace_id: "trace-audit-session",
                decision: selectedActionForInspect.outcome,
                outcome: selectedActionForInspect.outcome,
                reason_codes: [...selectedActionForInspect.reasonCodes],
                risk_tier: selectedActionForInspect.riskTier,
                profile_name: activeProfileName,
                profile_style: "balanced",
                profile_version: "1.0.0",
                created_at: new Date().toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
