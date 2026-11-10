"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, CardHeader, CopyableId, EmptyState } from "@/components/ui";
import {
  fetchReceipt,
  verifyReceiptChain,
  type DecisionReceiptDto,
  type ReceiptVerificationDto,
} from "@/lib/financial-api";

interface ReceiptDetailClientProps {
  readonly receiptId: string;
}

export function ReceiptDetailClient({ receiptId }: ReceiptDetailClientProps) {
  const [receipt, setReceipt] = useState<DecisionReceiptDto | null>(null);
  const [verification, setVerification] = useState<ReceiptVerificationDto | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReceipt(receiptId);
      setReceipt(res.data);
      if (!res.data && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await verifyReceiptChain();
      setVerification(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verification call failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">Auditor View</Badge>
              <span className="text-xs text-slate-500 font-mono">F13 Decision Receipt</span>
            </div>
            <h1 className="page-title text-2xl font-bold tracking-tight text-slate-900">
              Decision Receipt Explorer
            </h1>
            <p className="page-lead text-slate-600 text-sm mt-1">
              Tamper-evident, hash-linked cryptographic evidence chain recording all evaluated decisions,
              human approvals, and banking settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={verifying}
              onClick={() => void handleVerifyChain()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Verifying Chain...
                </>
              ) : (
                <>
                  <span>&#x2713;</span>
                  Verify Chain Cryptography
                </>
              )}
            </button>
            <Link
              href="/approvals"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Back to Approvals
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <CopyableId label="Query Ref (Receipt or Action ID)" value={receiptId} />
        </div>
      </Card>

      {/* Verification Result Banner */}
      {verification && (
        <div
          className={`border rounded-lg p-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
            verification.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  verification.valid ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <p className="font-bold">
                {verification.valid
                  ? "Cryptographic Hash Chain Valid & Tamper-Evident"
                  : "Chain Verification Failed"}
              </p>
            </div>
            <p className="text-xs mt-1">
              {verification.valid
                ? `All ${verification.total_receipts} receipts verified sequentially via SHA-256 parent hash linkage.`
                : verification.error || "Broken link detected in hash sequence."}
            </p>
          </div>
          {verification.head_hash && (
            <div className="text-[11px] font-mono bg-white/70 px-2 py-1 rounded border border-emerald-200 shrink-0">
              Head: {verification.head_hash.slice(0, 24)}...
            </div>
          )}
        </div>
      )}

      {/* Receipt Details Card */}
      {loading ? (
        <Card>
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Fetching cryptographic receipt from ledger...
          </div>
        </Card>
      ) : error || !receipt ? (
        <Card>
          <EmptyState
            title="Receipt Not Found"
            description={
              error ||
              `No decision receipt matches ID '${receiptId}'. Receipts are created when actions are evaluated, approved, or settled.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Cryptographic Linkage Block */}
          <Card>
            <CardHeader
              title={`Evidence Block #${receipt.chain_index} · ${receipt.event_type.toUpperCase()}`}
              subtitle="Cryptographic SHA-256 linkage binding this event to the previous chain state."
            />

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Chain Index
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    #{receipt.chain_index}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Event Type
                  </span>
                  <span className="text-base font-bold text-teal-800 capitalize font-mono">
                    {receipt.event_type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Hash Linkage Chain */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-sans font-bold">
                    1. Previous Receipt Hash (Parent Link)
                  </span>
                  <span className="text-teal-300 break-all select-all">
                    {receipt.previous_receipt_hash || "0000000000000000000000000000000000000000000000000000000000000000 (Genesis)"}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-sans font-bold">
                    2. Payload Content Hash (SHA-256)
                  </span>
                  <span className="text-amber-300 break-all select-all">
                    {receipt.payload_hash}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-sans font-bold">
                    3. Current Receipt Hash (Computed Hash)
                  </span>
                  <span className="text-emerald-400 font-bold break-all select-all">
                    {receipt.receipt_hash}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-2">
                <span>
                  <strong>Timestamp:</strong> {new Date(receipt.created_at).toUTCString()}
                </span>
                <span>
                  <strong>Action ID:</strong>{" "}
                  <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">
                    {receipt.action_id}
                  </code>
                </span>
              </div>
            </div>
          </Card>

          {/* Payload Details */}
          <Card>
            <CardHeader
              title="Canonical JSON Payload"
              subtitle="Exact immutable payload dictionary hashed into this receipt."
            />
            <div className="mt-4">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg text-xs overflow-x-auto font-mono max-h-96">
                {JSON.stringify(receipt.payload, null, 2)}
              </pre>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
