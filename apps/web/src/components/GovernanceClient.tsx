"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionInspector } from "@/components/ActionInspector";
import { ErrorState } from "@/components/ErrorState";
import type {
  DecisionOutcome,
  GovernanceDecisionDto,
  GovernanceProfileDto,
} from "@/lib/financial-api";
import {
  getActiveGovernanceProfile,
  getGovernanceDecisions,
} from "@/lib/financial-api";

export function GovernanceClient() {
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
            Governance Decision Runtime
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time policy invariant enforcement, active baseline profile, and authoritative decision telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            {activeProfile?.name || "Balanced Control Profile"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            {activeProfile?.description ||
              "Authoritative balanced control: auto-allows verified payments within threshold and budget, mandates review for large payments or high-risk tiers."}
          </p>
        </div>
        <Link
          href="/policies"
          className="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-center"
        >
          Switch Profile
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Evaluations
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDecisions}</p>
          <span className="text-[11px] text-slate-500">Historical action proposals</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Allowed (Pass)
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{allowCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalDecisions > 0 ? `${Math.round((allowCount / totalDecisions) * 100)}%` : "0%"} of total
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Review Required
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{reviewCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">
            {totalDecisions > 0 ? `${Math.round((reviewCount / totalDecisions) * 100)}%` : "0%"} of total
          </span>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">
            Hard Denials
          </span>
          <p className="text-2xl font-black text-red-900 mt-1">{denyCount}</p>
          <span className="text-[11px] text-red-700 font-medium">
            {totalDecisions > 0 ? `${Math.round((denyCount / totalDecisions) * 100)}%` : "0%"} of total
          </span>
        </div>
      </div>

      {/* Decisions Log Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Evaluated Governance Decisions
            </h3>
            <p className="text-xs text-slate-500">
              Click any decision to inspect the authoritative policy breakdown and audit envelope.
            </p>
          </div>

          {/* Outcome Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
            {(["all", "allow", "review", "deny"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setOutcomeFilter(filter)}
                className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                  outcomeFilter === filter
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading governance telemetry...
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No decisions match this filter.</p>
            <p>Run financial agent tasks or trigger test evaluations to populate runtime decisions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Action ID / Trace</th>
                  <th className="px-6 py-3">Reason Codes</th>
                  <th className="px-6 py-3">Risk Tier</th>
                  <th className="px-6 py-3">Profile</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDecisions.map((dec) => {
                  const outcome = (dec.outcome || dec.decision) as DecisionOutcome;
                  const outcomeBadge =
                    outcome === "allow"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : outcome === "deny"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-amber-100 text-amber-800 border-amber-300";

                  return (
                    <tr
                      key={dec.action_id}
                      onClick={() => handleInspect(dec)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${outcomeBadge}`}
                        >
                          {outcome}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-600">
                        <div>{dec.action_id.slice(0, 8)}...</div>
                        <div className="text-[10px] text-slate-400">{dec.trace_id.slice(0, 12)}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {dec.reason_codes.slice(0, 2).map((rc) => (
                            <span
                              key={rc}
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200"
                            >
                              {rc}
                            </span>
                          ))}
                          {dec.reason_codes.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              +{dec.reason_codes.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {dec.risk_tier}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {dec.profile_name}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(dec.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(dec);
                          }}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Inspect
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

      {/* Action Inspector Drawer */}
      <ActionInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        decision={selectedDecision}
      />
    </div>
  );
}
