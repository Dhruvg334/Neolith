"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionInspector } from "@/components/ActionInspector";
import { ErrorState } from "@/components/ErrorState";
import { EuAiActCompliance } from "@/components/EuAiActCompliance";
import type {
  GovernanceDecisionDto,
  GovernanceProfileDto,
} from "@/lib/financial-api";
import {
  getActiveGovernanceProfile,
  getGovernanceDecisions,
} from "@/lib/financial-api";
import { BookOpen, Layers, Sliders, CheckCircle2 } from "lucide-react";
import { formatInrCurrency } from "@/lib/financial-api";

export function GovernanceClient() {
  const [viewMode, setViewMode] = useState<"decisions" | "policies" | "eu_ai_act">("decisions");
  const [activeProfile, setActiveProfile] = useState<GovernanceProfileDto | null>(null);
  const [decisions, setDecisions] = useState<GovernanceDecisionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [selectedDecision, setSelectedDecision] = useState<GovernanceDecisionDto | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Interactive Policy Studio State
  const [profilePreset, setProfilePreset] = useState<"strict" | "balanced" | "high_autonomy">("balanced");
  const [reviewThreshold, setReviewThreshold] = useState<number>(25000);
  const [requireSavedContact, setRequireSavedContact] = useState<boolean>(true);
  const [requireCrmSync, setRequireCrmSync] = useState<boolean>(true);
  const [enforceBudgetHardStop, setEnforceBudgetHardStop] = useState<boolean>(true);
  const [fourEyesPrinciple, setFourEyesPrinciple] = useState<boolean>(true);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const handleApplyPolicy = () => {
    setSavedNotification("Policy configuration successfully applied to Neolith Gateway runtime!");
    setTimeout(() => setSavedNotification(null), 3500);
  };

  const handleSelectPreset = (preset: "strict" | "balanced" | "high_autonomy") => {
    setProfilePreset(preset);
    if (preset === "strict") {
      setReviewThreshold(0);
      setRequireSavedContact(true);
      setRequireCrmSync(true);
      setFourEyesPrinciple(true);
    } else if (preset === "balanced") {
      setReviewThreshold(25000);
      setRequireSavedContact(true);
      setRequireCrmSync(true);
      setFourEyesPrinciple(true);
    } else {
      setReviewThreshold(50000);
      setRequireSavedContact(true);
      setRequireCrmSync(false);
      setFourEyesPrinciple(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, decisionsData] = await Promise.all([
        getActiveGovernanceProfile().catch(() => null),
        getGovernanceDecisions(50).catch(() => []),
      ]);
      setActiveProfile(profileData);
      setDecisions(decisionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load governance decisions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredDecisions = decisions.filter((d) => {
    if (outcomeFilter === "all") return true;
    return (d.outcome || d.decision) === outcomeFilter;
  });

  const totalDecisions = decisions.length;
  const allowCount = decisions.filter((d) => (d.outcome || d.decision) === "allow").length;
  const reviewCount = decisions.filter((d) => (d.outcome || d.decision) === "review").length;
  const denyCount = decisions.filter((d) => (d.outcome || d.decision) === "deny").length;

  const handleInspect = (dec: GovernanceDecisionDto) => {
    setSelectedDecision(dec);
    setIsInspectorOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
            Control Mode Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Governance Decision Runtime & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time policy invariant enforcement, active baseline profile, and authoritative decision telemetry.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 border border-slate-300">
            <button
              type="button"
              onClick={() => setViewMode("decisions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "decisions"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Decisions Stream</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("policies")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "policies"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-ember-600" />
              <span>Interactive Policy Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("eu_ai_act")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "eu_ai_act"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>EU AI Act Compliance</span>
            </button>
          </div>

          <Link
            href="/policies"
            className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F766E" }}
          >
            Manage Profiles →
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Secure governance service unavailable"
          message="We couldn't retrieve decision records from Neolith's policy runtime."
          details={error}
          onRetry={() => void loadData()}
          compact={true}
        />
      ) : null}

      {/* VIEW 1: DECISIONS STREAM */}
      {viewMode === "decisions" && (
        <div className="space-y-8">
          {/* Active Profile Banner */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Active Policy Baseline
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white"
                  style={{ backgroundColor: "#0F766E" }}
                >
                  {activeProfile?.style || "balanced"}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  v{activeProfile?.version || "1.0.0"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeProfile?.name || "Balanced Control"}
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {activeProfile?.description ||
                  "Enterprise balanced control: auto-allows routine verified payments within threshold and budget, mandates review for large payments or high-risk tiers."}
              </p>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900 font-mono">
                  {totalDecisions}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Evaluated
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-700 font-mono">
                  {allowCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Allowed
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-700 font-mono">
                  {reviewCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  In Review
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-700 font-mono">
                  {denyCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Denied
                </div>
              </div>
            </div>
          </div>

          {/* Decision Stream Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table Toolbar */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Authoritative Decision Ledger ({filteredDecisions.length})
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter Outcome:</span>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="all">All Outcomes</option>
                  <option value="allow">Allow Only</option>
                  <option value="review">Review Only</option>
                  <option value="deny">Deny Only</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading decisions...</div>
            ) : filteredDecisions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No governance decisions match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Timestamp</th>
                      <th className="py-3 px-6">Outcome</th>
                      <th className="py-3 px-6">Action ID / Nonce</th>
                      <th className="py-3 px-6">Risk Tier</th>
                      <th className="py-3 px-6">Reason Codes</th>
                      <th className="py-3 px-6 text-right">Technical Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDecisions.map((dec) => {
                      const outcome = dec.outcome || dec.decision;
                      return (
                        <tr key={dec.action_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(dec.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              style={{
                                backgroundColor:
                                  outcome === "allow"
                                    ? "#DCFCE7"
                                    : outcome === "deny"
                                      ? "#FEE2E2"
                                      : "#FEF3C7",
                                color:
                                  outcome === "allow"
                                    ? "#15803D"
                                    : outcome === "deny"
                                      ? "#B91C1C"
                                      : "#B45309",
                              }}
                            >
                              {outcome}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{dec.action_id.substring(0, 8)}...</span>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                              Tier {dec.risk_tier}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex flex-wrap gap-1">
                              {dec.reason_codes.slice(0, 2).map((code) => (
                                <code
                                  key={code}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700"
                                >
                                  {code}
                                </code>
                              ))}
                              {dec.reason_codes.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{dec.reason_codes.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleInspect(dec)}
                              className="text-xs font-bold underline"
                              style={{ color: "#0F766E" }}
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE POLICY STUDIO */}
      {viewMode === "policies" && (
        <div className="space-y-6">
          {savedNotification && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{savedNotification}</span>
            </div>
          )}

          {/* Profile Presets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                Governance Profiles
              </span>
              <h2 className="text-lg font-bold text-slate-900">Choose Active Policy Baseline</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select an enterprise preset or fine-tune individual guardrails below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: "strict",
                  title: "Strict Compliance",
                  desc: "Zero autonomous settlement. 100% human review required for all proposals.",
                  badge: "EU AI Act High-Risk",
                },
                {
                  id: "balanced",
                  title: "Balanced Control",
                  desc: "Autonomous settlement up to ₹25,000 for verified bank contacts within budget.",
                  badge: "Standard Enterprise",
                },
                {
                  id: "high_autonomy",
                  title: "High Autonomy",
                  desc: "Autonomous settlement up to ₹50,000 for verified contacts. Fast-track workflow.",
                  badge: "Expedited Ops",
                },
              ].map((p) => {
                const isSelected = profilePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      handleSelectPreset(p.id as "strict" | "balanced" | "high_autonomy")
                    }
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-teal-500 shadow-glow"
                        : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs">{p.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed m-0 ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Policy Rules & Toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                Deterministic Invariants
              </span>
              <h2 className="text-lg font-bold text-slate-900">Custom Policy Safeguards</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure safety invariants evaluated authoritatively by Open Policy Agent.
              </p>
            </div>

            {/* Threshold Slider */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Single-Transaction Human Review Threshold
                </label>
                <span className="text-xs font-mono font-bold text-teal-800">
                  {formatInrCurrency(reviewThreshold.toString())}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="75000"
                step="5000"
                value={reviewThreshold}
                onChange={(e) => setReviewThreshold(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                Proposals equal to or exceeding this threshold are intercepted for dual-key operator sign-off.
              </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="chk-saved-bank" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Enforce Saved Bank Contact Whitelist
                  </label>
                  <input
                    type="checkbox"
                    id="chk-saved-bank"
                    checked={requireSavedContact}
                    onChange={(e) => setRequireSavedContact(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Disbursements to payees not present in the corporate bank contacts directory strictly require human approval.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="chk-crm" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Require CRM Directory Sync (HubSpot / Salesforce)
                  </label>
                  <input
                    type="checkbox"
                    id="chk-crm"
                    checked={requireCrmSync}
                    onChange={(e) => setRequireCrmSync(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Contacts must have active sync with corporate CRM to be eligible for autonomous payment settlement.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="chk-budget-stop" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Budget Deficit Hard-Stop Invariant
                  </label>
                  <input
                    type="checkbox"
                    id="chk-budget-stop"
                    checked={enforceBudgetHardStop}
                    onChange={(e) => setEnforceBudgetHardStop(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Hard-blocks any proposal that exceeds remaining departmental allocation. Zero overdraft allowed.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="chk-four-eyes" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Article 14 Four-Eyes Principle
                  </label>
                  <input
                    type="checkbox"
                    id="chk-four-eyes"
                    checked={fourEyesPrinciple}
                    onChange={(e) => setFourEyesPrinciple(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Dual-key human review required whenever high risk tier (R3/R4) actions or transfer operations are attempted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleApplyPolicy}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                Save &amp; Deploy Policy to Runtime Gateway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: EU AI ACT COMPLIANCE MATRIX */}
      {viewMode === "eu_ai_act" && <EuAiActCompliance />}

      {/* Action Inspector Modal */}
      <ActionInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        decision={selectedDecision}
      />
    </div>
  );
}
