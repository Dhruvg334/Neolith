"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, CopyableId, EmptyState } from "@/components/ui";
import {
  fetchApprovals,
  formatInrCurrency,
  submitApprovalDecision,
  type ApprovalRecordDto,
} from "@/lib/financial-api";

export function ApprovalsQueueClient() {
  const [approvals, setApprovals] = useState<readonly ApprovalRecordDto[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    id: string;
    text: string;
    receiptId?: string | null;
  } | null>(null);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stateParam = filter === "all" ? undefined : filter;
      const res = await fetchApprovals(stateParam);
      setApprovals(res.data);
      if (res.error && !res.live) {
        // Still display fallback data gracefully
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  const handleDecision = async (approvalId: string, decision: "approve" | "reject") => {
    setSubmittingId(approvalId);
    setSuccessMessage(null);
    const note = actionNotes[approvalId] || "";
    try {
      const res = await submitApprovalDecision(approvalId, decision, note);
      if (res.success && res.data) {
        setSuccessMessage({
          id: approvalId,
          text: res.data.message,
          receiptId: res.data.receipt_id,
        });
        await loadApprovals();
      } else {
        alert(res.error || "Failed to submit decision");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingCount = approvals.filter((a) => a.state === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="review">Human-in-the-Loop</Badge>
              <span className="text-xs text-slate-500 font-mono">F08 · F09 · F10 · F13</span>
            </div>
            <h1 className="page-title text-2xl font-bold tracking-tight text-slate-900">
              Operational Approval Queue
            </h1>
            <p className="page-lead text-slate-600 text-sm mt-1">
              Protected financial and administrative actions requiring explicit operator review bound
              to canonical SHA-256 request hashes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
            <div className="text-xs text-amber-900">
              <p className="font-semibold">Pending Review</p>
              <p className="text-amber-700">Requires authorization</p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-4 mt-6">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                filter === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void loadApprovals()}
            className="ml-auto text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Refresh Queue
          </button>
        </div>
      </Card>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-emerald-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="font-semibold">Decision Processed Successfully</p>
            <p className="text-xs text-emerald-800">{successMessage.text}</p>
          </div>
          {successMessage.receiptId && (
            <Link
              href={`/receipts/${successMessage.receiptId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded text-xs hover:bg-emerald-800 transition-colors shrink-0"
            >
              View Decision Receipt &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900 text-sm">
          <p className="font-semibold">Error Loading Approvals</p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Approvals List */}
      {loading ? (
        <Card>
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Loading approval requests from runtime...
          </div>
        </Card>
      ) : approvals.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${filter === "all" ? "" : filter} approvals`}
            description={
              filter === "pending"
                ? "There are currently no proposals awaiting human approval. Actions below thresholds execute autonomously."
                : `No approvals match state filter '${filter}'.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isSubmitting = submittingId === appr.id;
            const isPending = appr.state === "pending";

            return (
              <Card key={appr.id}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {appr.operation.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {appr.resource && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-xs font-mono font-semibold text-slate-700">
                          {appr.resource}
                        </span>
                      )}
                      <Badge
                        variant={
                          appr.state === "approved"
                            ? "allow"
                            : appr.state === "rejected"
                            ? "deny"
                            : "review"
                        }
                      >
                        {appr.state.toUpperCase()}
                      </Badge>
                      {appr.category && (
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {appr.category}
                        </span>
                      )}
                    </div>

                    {appr.description && (
                      <p className="text-sm text-slate-600">{appr.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block font-medium">Proposed Amount:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatInrCurrency(appr.amount, appr.currency || "INR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Beneficiary / Vendor:</span>
                        <span className="font-semibold text-slate-800">
                          {appr.vendor_name || "Direct Vendor"}
                          {appr.is_verified_vendor ? (
                            <span className="ml-1 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 py-0.5 rounded">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="ml-1 text-[10px] text-amber-700 font-bold bg-amber-100 px-1 py-0.5 rounded">
                              UNVERIFIED
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Expires At:</span>
                        <span className="font-mono text-slate-700">
                          {new Date(appr.expires_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Reason Codes */}
                    {appr.reason_codes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400">Trigger:</span>
                        {appr.reason_codes.map((rc) => (
                          <span
                            key={rc}
                            className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-medium"
                          >
                            {rc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Hash & IDs */}
                    <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                      <CopyableId label="Action ID" value={appr.action_id} />
                      <CopyableId label="Request Hash" value={appr.action_hash} />
                    </div>
                  </div>

                  {/* Right Column: Decision Form */}
                  <div className="md:w-80 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    {isPending ? (
                      <div className="space-y-3">
                        <label
                          htmlFor={`note-${appr.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Operator Review Justification
                        </label>
                        <textarea
                          id={`note-${appr.id}`}
                          rows={2}
                          placeholder="Audit rationale for this decision..."
                          value={actionNotes[appr.id] || ""}
                          onChange={(e) =>
                            setActionNotes((prev) => ({ ...prev, [appr.id]: e.target.value }))
                          }
                          className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDecision(appr.id, "approve")}
                            className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {isSubmitting ? "Processing..." : "Approve & Settle"}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDecision(appr.id, "reject")}
                            className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <span className="font-semibold text-slate-700 block">Decision Record</span>
                        <p className="text-slate-600">
                          {appr.decision_note ? `"${appr.decision_note}"` : "No note provided."}
                        </p>
                        {appr.decided_at && (
                          <span className="text-[11px] text-slate-400 block font-mono">
                            Decided: {new Date(appr.decided_at).toLocaleString()}
                          </span>
                        )}
                        <div className="pt-2">
                          <Link
                            href={`/receipts/${appr.action_id}`}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                          >
                            View Linked Receipts &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
