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
import { BookOpen, Layers } from "lucide-react";

export function GovernanceClient() {
  const [viewMode, setViewMode] = useState<"decisions" | "eu_ai_act">("decisions");
  const [activeProfile, setActiveProfile] = useState<GovernanceProfileDto | null>(null);
  const [decisions, setDecisions] = useState<GovernanceDecisionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [selectedDecision, setSelectedDecision] = useState<GovernanceDecisionDto | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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

      {/* VIEW 2: EU AI ACT COMPLIANCE MATRIX */}
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
