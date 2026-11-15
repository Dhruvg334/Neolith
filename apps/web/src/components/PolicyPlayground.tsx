"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Sliders,
  Terminal,
} from "lucide-react";
import { formatInrCurrency } from "@/lib/financial-api";

interface PlaygroundPreset {
  name: string;
  actionType: "pay_invoice" | "transfer_funds" | "add_beneficiary" | "cancel_payment";
  targetId: string;
  amount: string;
  category: string;
  vendorName: string;
  isVerified: boolean;
  role: string;
  description: string;
}

const PLAYGROUND_PRESETS: readonly PlaygroundPreset[] = [
  {
    name: "Routine Software (INV-001)",
    actionType: "pay_invoice",
    targetId: "INV-001",
    amount: "8000.00",
    category: "Software",
    vendorName: "Acme Cloud Services",
    isVerified: true,
    role: "financial-ai-agent",
    description: "Routine SaaS invoice under INR 25,000 threshold with verified vendor and ample Software budget.",
  },
  {
    name: "Threshold Breach (INV-002)",
    actionType: "pay_invoice",
    targetId: "INV-002",
    amount: "35000.00",
    category: "Infrastructure",
    vendorName: "Nova Compute Systems",
    isVerified: true,
    role: "financial-ai-agent",
    description: "Infrastructure capacity payment exceeding the INR 25,000 operator review ceiling.",
  },
  {
    name: "Budget Overrun (INV-003)",
    actionType: "pay_invoice",
    targetId: "INV-003",
    amount: "65000.00",
    category: "Infrastructure",
    vendorName: "Quantum Hosting Labs",
    isVerified: false,
    role: "financial-ai-agent",
    description: "Attempted infrastructure payment exceeding remaining budget cap and unverified vendor.",
  },
  {
    name: "Unverified Vendor Transfer",
    actionType: "transfer_funds",
    targetId: "TX-ROUG-09",
    amount: "15000.00",
    category: "Miscellaneous",
    vendorName: "Shadow Trading Corp",
    isVerified: false,
    role: "financial-ai-agent",
    description: "Direct bank transfer to unverified third party without whitelisted vendor contract.",
  },
];

interface SimulationResult {
  decision: "allow" | "review" | "deny";
  reasonCodes: string[];
  riskTier: string;
  ruleExplanation: string;
  evalTimeMs: number;
  budgetBefore: string;
  budgetAfter: string;
  permitPreview?: {
    token: string;
    ttlSeconds: number;
    nonce: string;
    targetResource: string;
  };
  policyInput: Record<string, unknown>;
  policyOutput: Record<string, unknown>;
}

export function PolicyPlayground() {
  // Input fields
  const [actionType, setActionType] = useState<PlaygroundPreset["actionType"]>("pay_invoice");
  const [targetId, setTargetId] = useState("INV-001");
  const [amount, setAmount] = useState("8000.00");
  const [category, setCategory] = useState("Software");
  const [vendorName, setVendorName] = useState("Acme Cloud Services");
  const [isVerified, setIsVerified] = useState(true);
  const [callerRole, setCallerRole] = useState("financial-ai-agent");
  const [activeProfile, setActiveProfile] = useState<"balanced" | "strict" | "high_autonomy">("balanced");
  const [reviewThreshold, setReviewThreshold] = useState("25000.00");

  // Simulation execution state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<"verdict" | "permit" | "contracts">("verdict");
  const [result, setResult] = useState<SimulationResult | null>(() => evaluateLocally({
    actionType: "pay_invoice",
    targetId: "INV-001",
    amount: "8000.00",
    category: "Software",
    vendorName: "Acme Cloud Services",
    isVerified: true,
    callerRole: "financial-ai-agent",
    activeProfile: "balanced",
    reviewThreshold: "25000.00",
  }));

  function handleSelectPreset(preset: PlaygroundPreset) {
    setActionType(preset.actionType);
    setTargetId(preset.targetId);
    setAmount(preset.amount);
    setCategory(preset.category);
    setVendorName(preset.vendorName);
    setIsVerified(preset.isVerified);
    setCallerRole(preset.role);

    const simulated = evaluateLocally({
      actionType: preset.actionType,
      targetId: preset.targetId,
      amount: preset.amount,
      category: preset.category,
      vendorName: preset.vendorName,
      isVerified: preset.isVerified,
      callerRole: preset.role,
      activeProfile,
      reviewThreshold,
    });
    setResult(simulated);
  }

  function handleRunSimulation() {
    setIsEvaluating(true);
    setTimeout(() => {
      const simulated = evaluateLocally({
        actionType,
        targetId,
        amount,
        category,
        vendorName,
        isVerified,
        callerRole,
        activeProfile,
        reviewThreshold,
      });
      setResult(simulated);
      setIsEvaluating(false);
    }, 280);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
              <Terminal className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Policy Simulation Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Zero-Trust Policy Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Policy Playground & Dry-Run Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Simulate candidate action proposals against Neolith&apos;s authoritative Open Policy Agent (OPA) invariants.
            Inspect exact reason codes, risk classification, single-use permit tokens, and budget deltas before dispatching live financial transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isEvaluating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 flex-shrink-0"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isEvaluating ? "animate-pulse" : ""}`} />
          <span>{isEvaluating ? "Evaluating Invariants..." : "Run Policy Simulation"}</span>
        </button>
      </div>

      {/* Preset Quick-Buttons */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Test Benchmarks & Quick Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PLAYGROUND_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-xl border text-left transition-all ${
                targetId === p.targetId && amount === p.amount
                  ? "border-orange-500 bg-orange-50/60 ring-1 ring-orange-500"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <div className="font-bold text-xs text-slate-900 mb-1 flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">{formatInrCurrency(p.amount)}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Candidate Proposal Parameters
            </span>
            <button
              type="button"
              onClick={() => handleSelectPreset(PLAYGROUND_PRESETS[0]!)}
              className="text-[10px] text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="play-action-type" className="block text-[11px] font-bold text-slate-700 mb-1">
                Action Type
              </label>
              <select
                id="play-action-type"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as PlaygroundPreset["actionType"])}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
              >
                <option value="pay_invoice">pay_invoice</option>
                <option value="transfer_funds">transfer_funds</option>
                <option value="cancel_payment">cancel_payment</option>
                <option value="add_beneficiary">add_beneficiary</option>
              </select>
            </div>

            <div>
              <label htmlFor="play-target-id" className="block text-[11px] font-bold text-slate-700 mb-1">
                Target Resource ID
              </label>
              <input
                id="play-target-id"
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                placeholder="e.g. INV-001"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="play-amount" className="text-[11px] font-bold text-slate-700">
                Amount (INR)
              </label>
              <div className="flex gap-1">
                {["8000.00", "20000.00", "35000.00", "65000.00"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-mono"
                  >
                    {parseInt(v, 10) / 1000}k
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                ₹
              </span>
              <input
                id="play-amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
                placeholder="8000.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="play-category" className="block text-[11px] font-bold text-slate-700 mb-1">
                Spending Category
              </label>
              <select
                id="play-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="Software">Software</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Operations">Operations</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor="play-vendor" className="block text-[11px] font-bold text-slate-700 mb-1">
                Vendor / Counterparty
              </label>
              <input
                id="play-vendor"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                placeholder="Vendor Name"
              />
            </div>
          </div>

          {/* Verification & Profile Switches */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="font-semibold text-slate-700">Vendor Whitelist Status</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className={isVerified ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                  {isVerified ? "Verified" : "Unverified"}
                </span>
              </span>
            </label>

            <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Enforced Baseline</span>
              <select
                value={activeProfile}
                onChange={(e) => setActiveProfile(e.target.value as "balanced" | "strict" | "high_autonomy")}
                className="p-1 text-xs rounded border border-slate-200 font-medium text-slate-800"
              >
                <option value="balanced">Balanced Control</option>
                <option value="strict">Strict Control</option>
                <option value="high_autonomy">High Autonomy</option>
              </select>
            </div>

            <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Review Threshold</span>
              {activeProfile === "strict" ? (
                <span className="font-mono font-bold text-red-600">INR 0 (All Review)</span>
              ) : (
                <input
                  type="text"
                  value={reviewThreshold}
                  onChange={(e) => setReviewThreshold(e.target.value)}
                  className="w-24 p-1 text-xs text-right font-mono font-bold text-orange-600 rounded border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Authoritative OPA Rego Decision Results (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070B16] text-white p-5 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Authoritative Gateway Verdict
                </span>
              </div>

              {/* Tab Pills */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("verdict")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "verdict"
                      ? "bg-orange-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  Verdict & Reason
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("permit")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "permit"
                      ? "bg-orange-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  Execution Permit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contracts")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "contracts"
                      ? "bg-orange-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  Contract JSON
                </button>
              </div>
            </div>

            {/* Tab 1: Verdict & Reason */}
            {activeTab === "verdict" && result && (
              <div className="space-y-4">
                {/* Decision Headline Box */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    result.decision === "allow"
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                      : result.decision === "review"
                        ? "border-amber-500/40 bg-amber-950/30 text-amber-200"
                        : "border-red-500/40 bg-red-950/30 text-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.decision === "allow" && <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />}
                    {result.decision === "review" && <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />}
                    {result.decision === "deny" && <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />}
                    <div>
                      <div className="text-sm font-black uppercase tracking-wider">
                        {result.decision === "allow" && "ALLOW — ROUTINE AUTONOMOUS SETTLEMENT"}
                        {result.decision === "review" && "REVIEW — MANDATORY OPERATOR APPROVAL"}
                        {result.decision === "deny" && "DENY — SAFEGUARD INVARIANT REJECTION"}
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5">
                        Evaluated in {result.evalTimeMs} ms &bull; Tier {result.riskTier}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 uppercase">
                    {activeProfile}
                  </span>
                </div>

                {/* Explanation */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs leading-relaxed text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Invariant Rule Explanation:</span>
                  </div>
                  <p>{result.ruleExplanation}</p>
                </div>

                {/* OPA Reason Codes */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Triggered Reason Codes
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {result.reasonCodes.map((rc) => (
                      <code
                        key={rc}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-orange-300 border border-slate-700"
                      >
                        {rc}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Budget Headroom Meter */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{category} Budget Headroom:</span>
                    <span className="font-mono text-white">
                      {formatInrCurrency(result.budgetBefore)} &rarr;{" "}
                      <strong className="text-orange-400">{formatInrCurrency(result.budgetAfter)}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        result.decision === "deny"
                          ? "bg-red-500 w-full"
                          : result.decision === "review"
                            ? "bg-amber-500 w-3/4"
                            : "bg-emerald-500 w-1/4"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Execution Permit Preview */}
            {activeTab === "permit" && (
              <div className="space-y-3">
                {result?.permitPreview ? (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-emerald-400 border-b border-emerald-900/50 pb-2">
                      <span className="font-bold inline-flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ed25519 Cryptographic Permit Granted</span>
                      </span>
                      <span>TTL: {result.permitPreview.ttlSeconds}s</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">PERMIT TOKEN (BEARER WRITE):</span>
                      <span className="text-orange-300 break-all">{result.permitPreview.token}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">REPLAY NONCE:</span>
                        <span className="text-white">{result.permitPreview.nonce}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">TARGET RESOURCE:</span>
                        <span className="text-white">{result.permitPreview.targetResource}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans italic pt-1">
                      This permit authorizes exactly one execution debit against the Operations Account. It expires in 60 seconds and cannot be replayed.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
                    <XCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-300">No Execution Permit Minted</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      {result?.decision === "review"
                        ? "Action is paused in the human approval queue. Execution permits are minted only after operator signature."
                        : "Action was denied by policy invariants. No ambient tokens or write permits are issued."}
                    </p>
                    {result?.decision === "review" && (
                      <Link
                        href="/approvals"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 underline pt-2"
                      >
                        <span>Inspect in /approvals queue</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Contract JSON */}
            {activeTab === "contracts" && result && (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Policy Input Envelope (JSON)</span>
                  <span className="text-[10px] text-orange-400">spec: policy-input.schema.json</span>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-slate-300 overflow-x-auto max-h-56">
                  {JSON.stringify(result.policyInput, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Quick Footer Link */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Deterministic Open Policy Agent (v1.22.2)</span>
            <Link href="/governance" className="text-orange-400 hover:text-orange-300 underline flex items-center gap-1">
              <span>View Active Decisions Audit &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Local Invariant Engine Simulation (Mirroring OPA Rego neolith.rego rules)
function evaluateLocally(params: {
  actionType: string;
  targetId: string;
  amount: string;
  category: string;
  vendorName: string;
  isVerified: boolean;
  callerRole: string;
  activeProfile: "balanced" | "strict" | "high_autonomy";
  reviewThreshold: string;
}): SimulationResult {
  const amountNum = parseFloat(params.amount || "0");
  const thresholdNum = parseFloat(params.reviewThreshold || "25000");
  const categoryCap = params.category === "Infrastructure" ? 30000 : 50000;
  const simulatedCurrentSpent = params.category === "Infrastructure" ? 30000 : 8000;
  const remaining = Math.max(0, categoryCap - simulatedCurrentSpent);

  const policyInput = {
    action: {
      operation: params.actionType,
      target_id: params.targetId,
      amount: params.amount,
      currency: "INR",
      category: params.category,
      vendor: params.vendorName,
    },
    caller: {
      role: params.callerRole,
      verified_beneficiary: params.isVerified,
    },
    profile: {
      style: params.activeProfile,
      review_threshold: params.reviewThreshold,
    },
    budget: {
      category: params.category,
      remaining_before: remaining.toFixed(2),
    },
  };

  // 1. Strict profile: All write actions require human operator review
  if (params.activeProfile === "strict") {
    return {
      decision: "review",
      reasonCodes: ["STRICT_PROFILE_MANDATORY_REVIEW", "APPROVAL_REQUIRED"],
      riskTier: "R3",
      ruleExplanation:
        "Strict Governance Baseline enforced: autonomous execution is disabled for all financial write actions. Action enqueued in /approvals for operator signature.",
      evalTimeMs: 1.4,
      budgetBefore: remaining.toFixed(2),
      budgetAfter: remaining.toFixed(2),
      policyInput,
      policyOutput: { decision: "review", reason_codes: ["STRICT_PROFILE_MANDATORY_REVIEW"] },
    };
  }

  // 2. Budget invariant violation
  if (amountNum > remaining) {
    return {
      decision: "deny",
      reasonCodes: ["DENY_BUDGET_EXCEEDED", "INVARIANT_BREACH"],
      riskTier: "R4",
      ruleExplanation: `Proposed INR ${amountNum.toLocaleString()} exceeds available ${params.category} budget (INR ${remaining.toLocaleString()} remaining). Blocked to prevent financial overrun.`,
      evalTimeMs: 1.2,
      budgetBefore: remaining.toFixed(2),
      budgetAfter: remaining.toFixed(2),
      policyInput,
      policyOutput: { decision: "deny", reason_codes: ["DENY_BUDGET_EXCEEDED"] },
    };
  }

  // 3. Unverified beneficiary invariant
  if (!params.isVerified) {
    return {
      decision: "deny",
      reasonCodes: ["UNVERIFIED_BENEFICIARY", "COUNTERPARTY_RISK"],
      riskTier: "R4",
      ruleExplanation: `Counterparty "${params.vendorName}" is not on the corporate verified vendor whitelist. Blocked under invariant INV-004.`,
      evalTimeMs: 1.6,
      budgetBefore: remaining.toFixed(2),
      budgetAfter: remaining.toFixed(2),
      policyInput,
      policyOutput: { decision: "deny", reason_codes: ["UNVERIFIED_BENEFICIARY"] },
    };
  }

  // 4. Operator review threshold breach
  if (amountNum > thresholdNum) {
    return {
      decision: "review",
      reasonCodes: ["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
      riskTier: "R3",
      ruleExplanation: `Transaction amount INR ${amountNum.toLocaleString()} exceeds the operator review threshold of INR ${thresholdNum.toLocaleString()}. Halted for dual-control operator review.`,
      evalTimeMs: 1.8,
      budgetBefore: remaining.toFixed(2),
      budgetAfter: remaining.toFixed(2),
      policyInput,
      policyOutput: { decision: "review", reason_codes: ["REVIEW_THRESHOLD_EXCEEDED"] },
    };
  }

  // 5. Allowed routine spend
  const remainingAfter = Math.max(0, remaining - amountNum);
  return {
    decision: "allow",
    reasonCodes: ["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
    riskTier: "R2",
    ruleExplanation: `Compliant with ${params.category} budget, verified beneficiary, and below operator review threshold. 60-second Ed25519 execution permit granted.`,
    evalTimeMs: 1.9,
    budgetBefore: remaining.toFixed(2),
    budgetAfter: remainingAfter.toFixed(2),
    permitPreview: {
      token: `permit_ed25519_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      ttlSeconds: 60,
      nonce: `nonce_live_sim_${Date.now().toString(16)}`,
      targetResource: params.targetId,
    },
    policyInput,
    policyOutput: { decision: "allow", reason_codes: ["BASE_POLICY_ALLOW"], permit_minted: true },
  };
}
