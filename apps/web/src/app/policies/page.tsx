"use client";

import { useCallback, useEffect, useState } from "react";
import type { GovernanceProfileDto } from "@/lib/financial-api";
import {
  activateGovernanceProfile,
  createGovernanceProfile,
  getGovernanceProfiles,
} from "@/lib/financial-api";

export default function PoliciesPage() {
  const [profiles, setProfiles] = useState<GovernanceProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Custom policy builder state
  const [customName, setCustomName] = useState("Custom Treasury Policy");
  const [customDesc, setCustomDesc] = useState(
    "Organisation-specific risk threshold limits and operational review gates."
  );
  const [customMaxSpend, setCustomMaxSpend] = useState("100000.00");
  const [customReviewThresh, setCustomReviewThresh] = useState("25000.00");
  const [customRequireVerified, setCustomRequireVerified] = useState(true);
  const [customReviewTransfer, setCustomReviewTransfer] = useState(true);
  const [savingCustom, setSavingCustom] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGovernanceProfiles();
      setProfiles(data);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load profiles",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const handleActivate = async (profileId: string) => {
    try {
      setActivatingId(profileId);
      setFeedback(null);
      const updated = await activateGovernanceProfile(profileId);
      setProfiles((prev) =>
        prev.map((p) => ({
          ...p,
          active: p.id === updated.id,
        }))
      );
      setFeedback({
        type: "success",
        message: `Activated profile: ${updated.name}. Active policy baseline updated.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to activate profile",
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCustom(true);
      setFeedback(null);
      const operations: string[] = [];
      if (customReviewTransfer) operations.push("transfer_funds");

      const created = await createGovernanceProfile({
        name: customName,
        style: "custom",
        description: customDesc,
        configuration: {
          max_action_amount: customMaxSpend,
          review_threshold: customReviewThresh,
          require_verified_beneficiary: customRequireVerified,
          require_review_operations: operations,
        },
      });

      // Activate immediately
      await activateGovernanceProfile(created.id);
      await loadProfiles();
      setFeedback({
        type: "success",
        message: `Custom profile "${created.name}" created and activated successfully!`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save custom profile",
      });
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">
          Control Mode • Policy Management
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Governance Profiles & Thresholds
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select standard risk profiles or configure custom spend limits, review thresholds, and operational constraints.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Profiles Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Available Governance Profiles
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading policy profiles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`rounded-xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                  profile.active
                    ? "border-teal-700 bg-teal-50/20 ring-1 ring-teal-700"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 text-[10px] font-bold uppercase rounded text-white"
                      style={{
                        backgroundColor:
                          profile.style === "strict"
                            ? "#0B1F33"
                            : profile.style === "balanced"
                              ? "#0F766E"
                              : profile.style === "high_autonomy"
                                ? "#F97316"
                                : "#475569",
                      }}
                    >
                      {profile.style}
                    </span>
                    {profile.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Active Baseline
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{profile.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700">Governance Invariants:</div>
                    <ul className="list-inside list-disc text-slate-500 text-[11px] space-y-0.5">
                      <li>Identity & tool status verified via OPA</li>
                      <li>Category budget cap strictly enforced</li>
                      {profile.style === "strict" && (
                        <li className="text-slate-800 font-medium">All protected financial writes mandate operator review</li>
                      )}
                      {profile.style === "balanced" && (
                        <li className="text-slate-800 font-medium">Auto-allows routine actions; reviews threshold breaches</li>
                      )}
                      {profile.style === "high_autonomy" && (
                        <li className="text-slate-800 font-medium">Auto-allows routine R1-R3 actions; reviews critical R4</li>
                      )}
                      {profile.style === "custom" && (
                        <li className="text-slate-800 font-medium">Enforces tailored limits and designated review actions</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Version: {profile.version}
                  </span>
                  {profile.active ? (
                    <span className="text-xs font-bold text-teal-800">Currently Active</span>
                  ) : (
                    <button
                      type="button"
                      disabled={activatingId === profile.id}
                      onClick={() => void handleActivate(profile.id)}
                      className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#0F766E" }}
                    >
                      {activatingId === profile.id ? "Activating..." : "Activate Profile"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Policy Builder Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Custom Policy Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create an organisation-specific governance profile with custom spend ceilings and approval rules.
          </p>
        </div>

        <form onSubmit={(e) => void handleSaveCustom(e)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="custom-profile-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Profile Name
              </label>
              <input
                id="custom-profile-name"
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-profile-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Description
              </label>
              <input
                id="custom-profile-desc"
                type="text"
                required
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-max-spend" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Maximum Action Spend Limit (INR)
              </label>
              <input
                id="custom-max-spend"
                type="text"
                required
                value={customMaxSpend}
                onChange={(e) => setCustomMaxSpend(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-mono focus:border-teal-700 focus:outline-none"
                placeholder="100000.00"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Any single action exceeding this cap is denied with MAX_AMOUNT_EXCEEDED.
              </span>
            </div>

            <div>
              <label htmlFor="custom-review-thresh" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Operator Review Threshold (INR)
              </label>
              <input
                id="custom-review-thresh"
                type="text"
                required
                value={customReviewThresh}
                onChange={(e) => setCustomReviewThresh(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-mono focus:border-teal-700 focus:outline-none"
                placeholder="25000.00"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Actions at or above this amount require human operator review.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={customRequireVerified}
                onChange={(e) => setCustomRequireVerified(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 h-4 w-4"
              />
              <span className="text-xs text-slate-800 font-medium">
                Enforce verified vendor check (UNVERIFIED_BENEFICIARY denial on unverified recipients)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={customReviewTransfer}
                onChange={(e) => setCustomReviewTransfer(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 h-4 w-4"
              />
              <span className="text-xs text-slate-800 font-medium">
                Mandate operator review for all direct fund transfer operations (<code className="font-mono text-[11px]">transfer_funds</code>)
              </span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingCustom}
              className="rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#F97316" }}
            >
              {savingCustom ? "Saving..." : "Save & Activate Custom Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
