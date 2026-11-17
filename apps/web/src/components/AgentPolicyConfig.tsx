"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { formatInrCurrency } from "@/lib/financial-api";

export type PolicyProfileStyle = "balanced" | "strict" | "high_autonomy" | "custom";

export interface AgentPolicySettings {
  profileStyle: PolicyProfileStyle;
  profileName: string;
  softwareBudget: number;
  infrastructureBudget: number;
  miscellaneousBudget: number;
  reviewThreshold: number;
  maxActionAmount: number;
  requireVerifiedBeneficiary: boolean;
  requireReviewForTransfers: boolean;
}

export const DEFAULT_POLICY_SETTINGS: AgentPolicySettings = {
  profileStyle: "balanced",
  profileName: "Balanced Control",
  softwareBudget: 25000,
  infrastructureBudget: 50000,
  miscellaneousBudget: 10000,
  reviewThreshold: 25000,
  maxActionAmount: 100000,
  requireVerifiedBeneficiary: true,
  requireReviewForTransfers: true,
};

interface AgentPolicyConfigProps {
  readonly settings: AgentPolicySettings;
  readonly onSaveSettings: (newSettings: AgentPolicySettings) => void;
}

export function AgentPolicyConfig({ settings, onSaveSettings }: AgentPolicyConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<AgentPolicySettings>(settings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleProfileSelect = (style: PolicyProfileStyle) => {
    if (style === "strict") {
      setLocalSettings((prev) => ({
        ...prev,
        profileStyle: "strict",
        profileName: "Strict Control",
        reviewThreshold: 0, // Every action requires review
        requireVerifiedBeneficiary: true,
        requireReviewForTransfers: true,
      }));
    } else if (style === "balanced") {
      setLocalSettings((prev) => ({
        ...prev,
        profileStyle: "balanced",
        profileName: "Balanced Control",
        reviewThreshold: 25000,
        maxActionAmount: 100000,
        requireVerifiedBeneficiary: true,
        requireReviewForTransfers: true,
      }));
    } else if (style === "high_autonomy") {
      setLocalSettings((prev) => ({
        ...prev,
        profileStyle: "high_autonomy",
        profileName: "High Autonomy",
        reviewThreshold: 75000,
        maxActionAmount: 200000,
        requireVerifiedBeneficiary: true,
        requireReviewForTransfers: false,
      }));
    } else {
      setLocalSettings((prev) => ({
        ...prev,
        profileStyle: "custom",
        profileName: "Custom Policy Rules",
      }));
    }
  };

  const handleApply = () => {
    onSaveSettings(localSettings);
    setToastMessage(`Policy activated: ${localSettings.profileName}`);
    setTimeout(() => {
      setToastMessage(null);
      setIsOpen(false);
    }, 1800);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_POLICY_SETTINGS);
    onSaveSettings(DEFAULT_POLICY_SETTINGS);
    setToastMessage("Reset to Enterprise Balanced baseline");
    setTimeout(() => setToastMessage(null), 1800);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6 transition-all">
      {/* Top Telemetry & Control Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Governance & Budget Policy:
            </span>
          </div>

          {/* Active Profile Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            {settings.profileName}
          </span>

          {/* Review Threshold Pill */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
            <span className="text-slate-400">Review Threshold:</span>
            <strong className="text-slate-900 font-mono">
              {settings.reviewThreshold === 0
                ? "All Actions (0 INR)"
                : formatInrCurrency(settings.reviewThreshold.toString())}
            </strong>
          </span>

          {/* Budget Quick Indicator */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
            <span className="text-slate-400">Software Cap:</span>
            <strong className="text-emerald-700 font-mono">
              {formatInrCurrency(settings.softwareBudget.toString())}
            </strong>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
            <span className="text-slate-400">Verified Vendors:</span>
            <strong className={settings.requireVerifiedBeneficiary ? "text-emerald-700" : "text-amber-700"}>
              {settings.requireVerifiedBeneficiary ? "Strictly Enforced" : "Optional"}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>{isOpen ? "Collapse Policy Controls" : "Adjust Policies & Budgets"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Configuration Drawer */}
      {isOpen && (
        <div className="p-6 bg-white space-y-6 animate-fadeIn">
          {toastMessage && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Profile Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Select Governance Enforcement Baseline
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Balanced Control */}
              <button
                type="button"
                onClick={() => handleProfileSelect("balanced")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  localSettings.profileStyle === "balanced"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">Balanced Control</span>
                  {localSettings.profileStyle === "balanced" && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Enterprise default. Routine verified spend under INR 25,000 auto-allowed. High value or R3 held for review.
                </p>
                <div className="mt-2.5 text-[10px] font-mono text-orange-700 font-semibold">
                  Threshold: INR 25,000
                </div>
              </button>

              {/* Strict Control */}
              <button
                type="button"
                onClick={() => handleProfileSelect("strict")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  localSettings.profileStyle === "strict"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">Strict Control</span>
                  {localSettings.profileStyle === "strict" && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Zero autonomous execution. Every financial write action requires human operator signoff in /approvals.
                </p>
                <div className="mt-2.5 text-[10px] font-mono text-red-700 font-semibold">
                  Threshold: INR 0 (All Review)
                </div>
              </button>

              {/* High Autonomy */}
              <button
                type="button"
                onClick={() => handleProfileSelect("high_autonomy")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  localSettings.profileStyle === "high_autonomy"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">High Autonomy</span>
                  {localSettings.profileStyle === "high_autonomy" && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Automates verified R1-R3 operations up to INR 75,000. Holds for review only on critical R4 transactions.
                </p>
                <div className="mt-2.5 text-[10px] font-mono text-emerald-700 font-semibold">
                  Threshold: INR 75,000
                </div>
              </button>

              {/* Custom Control */}
              <button
                type="button"
                onClick={() => handleProfileSelect("custom")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  localSettings.profileStyle === "custom"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">Custom Rules</span>
                  {localSettings.profileStyle === "custom" && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Fine-tune individual category ceilings, review limits, and vendor verification requirements.
                </p>
                <div className="mt-2.5 text-[10px] font-mono text-slate-700 font-semibold">
                  Custom Parameters
                </div>
              </button>
            </div>
          </div>

          {/* Budget Ceilings & Thresholds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
            {/* Category Budgets */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Category Budget Caps (Monthly)
              </label>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Software Budget:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatInrCurrency(localSettings.softwareBudget.toString())}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={200000}
                  step={5000}
                  value={localSettings.softwareBudget}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      softwareBudget: Number(e.target.value),
                      profileStyle: "custom",
                      profileName: "Custom Policy Rules",
                    }))
                  }
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>INR 10,000</span>
                  <span>INR 200,000</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Infrastructure Budget:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatInrCurrency(localSettings.infrastructureBudget.toString())}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={200000}
                  step={5000}
                  value={localSettings.infrastructureBudget}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      infrastructureBudget: Number(e.target.value),
                      profileStyle: "custom",
                      profileName: "Custom Policy Rules",
                    }))
                  }
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>INR 10,000</span>
                  <span>INR 200,000</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Miscellaneous / Ops:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatInrCurrency(localSettings.miscellaneousBudget.toString())}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={localSettings.miscellaneousBudget}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      miscellaneousBudget: Number(e.target.value),
                      profileStyle: "custom",
                      profileName: "Custom Policy Rules",
                    }))
                  }
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Guardrail Thresholds */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Safety Guardrails & Ceilings
              </label>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Operator Review Threshold:</span>
                  <span className="font-mono font-bold text-orange-600">
                    {localSettings.reviewThreshold === 0
                      ? "Zero (All Actions Reviewed)"
                      : formatInrCurrency(localSettings.reviewThreshold.toString())}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={5000}
                  value={localSettings.reviewThreshold}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      reviewThreshold: Number(e.target.value),
                      profileStyle: "custom",
                      profileName: "Custom Policy Rules",
                    }))
                  }
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>INR 0 (Strict)</span>
                  <span>INR 100,000</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Transactions exceeding this value are automatically diverted to the /approvals queue.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Maximum Single Action Limit:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatInrCurrency(localSettings.maxActionAmount.toString())}
                  </span>
                </div>
                <input
                  type="range"
                  min={25000}
                  max={500000}
                  step={25000}
                  value={localSettings.maxActionAmount}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      maxActionAmount: Number(e.target.value),
                      profileStyle: "custom",
                      profileName: "Custom Policy Rules",
                    }))
                  }
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Invariant Enforcement Switches
              </label>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.requireVerifiedBeneficiary}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        requireVerifiedBeneficiary: e.target.checked,
                        profileStyle: "custom",
                        profileName: "Custom Policy Rules",
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enforce Verified Beneficiary Whitelist
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Blocks or halts any invoice or payment target not on the approved corporate vendor list.
                    </span>
                  </div>
                </label>

                <div className="border-t border-slate-200 pt-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.requireReviewForTransfers}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          requireReviewForTransfers: e.target.checked,
                          profileStyle: "custom",
                          profileName: "Custom Policy Rules",
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Mandate Review on Direct Funds Transfers
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Disallows autonomous bank-to-bank transfers regardless of threshold.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Informative Note */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3 text-[11px] text-orange-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Authoritative Enforcement:</strong> Changes take effect immediately in both the client simulation engine and the server-side OPA governance runtime.
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Policy & Budget Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
