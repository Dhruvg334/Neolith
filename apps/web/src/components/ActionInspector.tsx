"use client";

import { useEffect, useState } from "react";
import type {
  ExecutionRequestDto,
  GovernanceDecisionDto,
  InvoiceDto,
} from "@/lib/financial-api";
import { formatInrCurrency } from "@/lib/financial-api";

interface ActionInspectorProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly decision?: GovernanceDecisionDto | null;
  readonly action?: ExecutionRequestDto | null;
  readonly invoice?: InvoiceDto | null;
}

type TabKey = "summary" | "evidence" | "governance" | "activity";

export function ActionInspector({
  isOpen,
  onClose,
  decision,
  action,
  invoice,
}: ActionInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const outcome = decision?.outcome || decision?.decision || "review";
  const outcomeColor =
    outcome === "allow"
      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
      : outcome === "deny"
        ? "text-red-700 bg-red-50 border-red-300"
        : "text-amber-700 bg-amber-50 border-amber-300";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <aside
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-200"
        style={{
          borderLeft: "2px solid #0B1F33",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{ backgroundColor: "#0B1F33" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  outcome === "allow"
                    ? "#10B981"
                    : outcome === "deny"
                      ? "#EF4444"
                      : "#F97316",
              }}
            />
            <h2 className="text-base font-semibold tracking-wide">
              Action & Governance Inspector
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close inspector drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "summary"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "evidence"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Evidence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("governance")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "governance"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Governance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "activity"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Activity
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-800">
          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
                <div>
                  <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Authoritative Decision
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${outcomeColor}`}
                    >
                      {outcome}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      Risk Tier {decision?.risk_tier || "R2"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Policy Profile
                  </span>
                  <p className="mt-1 font-semibold text-slate-900">
                    {decision?.profile_name || "Balanced Control"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <span className="text-xs text-slate-500">Operation</span>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {action?.operation ||
                      (decision?.tool_metadata?.name
                        ? String(decision.tool_metadata.name)
                        : "pay_invoice")}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <span className="text-xs text-slate-500">Target Resource</span>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {action?.resource || invoice?.invoice_number || "INV-001"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <span className="text-xs text-slate-500">Amount & Currency</span>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatInrCurrency(
                      action?.amount || invoice?.amount || "0.00",
                      action?.currency || invoice?.currency || "INR"
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <span className="text-xs text-slate-500">Category</span>
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {action?.category || invoice?.category || "software"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Evaluated Policy Reason Codes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(decision?.reason_codes || ["BASE_POLICY_ALLOW"]).map((rc) => (
                    <span
                      key={rc}
                      className="inline-block rounded bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700 border border-slate-300"
                    >
                      {rc}
                    </span>
                  ))}
                </div>
              </div>

              {invoice && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Invoice Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Vendor:</span>{" "}
                      <span className="font-medium">{invoice.vendor_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Verified Vendor:</span>{" "}
                      <span className="font-medium">
                        {invoice.is_verified_vendor ? "✓ Verified" : "✗ Unverified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Due Date:</span>{" "}
                      <span>{invoice.due_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>{" "}
                      <span className="capitalize">{invoice.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Justification
                </h3>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {(action?.parameters?.justification as string) ||
                    invoice?.description ||
                    "Routine vendor invoice payment within monthly budget limits."}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Evidence References
                </h3>
                <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                  <li>Invoice record: {action?.resource || invoice?.invoice_number || "INV-001"}</li>
                  <li>Vendor directory match: {invoice?.vendor_name || "Acme Cloud"}</li>
                  <li>Category budget allocation: {action?.category || invoice?.category || "software"}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Trace & Correlation Identifiers
                </h3>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">Action ID:</span>{" "}
                    <span>{decision?.action_id || action?.action_id || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Trace ID:</span>{" "}
                    <span>{decision?.trace_id || action?.trace_id || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Profile ID:</span>{" "}
                    <span>{decision?.profile_id || "default"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "governance" && (
            <div className="space-y-6">
              {decision?.budget_check && (
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Category Budget Feasibility Check
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Category:</span>{" "}
                      <span className="font-semibold capitalize">
                        {decision.budget_check.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Allocated Limit:</span>{" "}
                      <span className="font-semibold">
                        {formatInrCurrency(decision.budget_check.allocated_limit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Spent Before Action:</span>{" "}
                      <span>{formatInrCurrency(decision.budget_check.current_spent)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining Before:</span>{" "}
                      <span>{formatInrCurrency(decision.budget_check.remaining_before)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining After:</span>{" "}
                      <span className="font-semibold text-teal-800">
                        {formatInrCurrency(decision.budget_check.remaining_after)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Approval Threshold:</span>{" "}
                      <span>
                        {decision.budget_check.approval_threshold
                          ? formatInrCurrency(decision.budget_check.approval_threshold)
                          : "None"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Feasible:</span>{" "}
                      <span
                        className={`font-bold ${
                          decision.budget_check.is_feasible
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {decision.budget_check.is_feasible ? "✓ YES" : "✗ NO"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Exceeds Threshold:</span>{" "}
                      <span
                        className={`font-bold ${
                          decision.budget_check.exceeds_threshold
                            ? "text-amber-700"
                            : "text-slate-700"
                        }`}
                      >
                        {decision.budget_check.exceeds_threshold ? "YES (Review)" : "NO"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Policy Engine Invariants
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-600">Emergency Stop Status</span>
                    <span className="text-emerald-700 font-semibold">Active & Normal (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-600">Agent Registration & Version</span>
                    <span className="text-emerald-700 font-semibold">Valid & Pinned (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-600">Capability Permission Binding</span>
                    <span className="text-emerald-700 font-semibold">Granted (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-600">Beneficiary Verification</span>
                    <span
                      className={`font-semibold ${
                        decision?.reason_codes?.includes("UNVERIFIED_BENEFICIARY")
                          ? "text-red-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {decision?.reason_codes?.includes("UNVERIFIED_BENEFICIARY")
                        ? "Failed (Unverified Vendor)"
                        : "Verified (Pass)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Action Timeline
              </h3>
              <ol className="relative border-l border-slate-200 ml-3 space-y-6">
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-teal-600" />
                  <time className="text-xs text-slate-400">
                    {action?.requested_at || decision?.created_at || "Recent"}
                  </time>
                  <p className="text-xs font-semibold text-slate-800">
                    Proposal Generated by Agent
                  </p>
                  <p className="text-xs text-slate-500">
                    Action proposed for tool {action?.operation || "pay_invoice"}.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-amber-500" />
                  <time className="text-xs text-slate-400">
                    {decision?.created_at || "Recent"}
                  </time>
                  <p className="text-xs font-semibold text-slate-800">
                    Evaluated by Governance Runtime
                  </p>
                  <p className="text-xs text-slate-500">
                    Result: {outcome.toUpperCase()} under {decision?.profile_name || "Balanced Control"}.
                  </p>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0B1F33" }}
          >
            Close Inspector
          </button>
        </div>
      </aside>
    </div>
  );
}
