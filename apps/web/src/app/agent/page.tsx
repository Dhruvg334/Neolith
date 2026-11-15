import type { Metadata } from "next";
import { AgentWorkspaceView } from "@/components/AgentWorkspaceView";
import { ErrorState } from "@/components/ErrorState";
import {
  FALLBACK_SUMMARY,
  FALLBACK_TOOLS,
  fetchApiResult,
  type FinancialSummaryDto,
  type FinancialToolMetadataDto,
  type InvoiceDto,
} from "@/lib/financial-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financial AI Agent Workspace",
  description:
    "Autonomous financial operations assistant operating with zero implicit authority under enterprise governance policies.",
  alternates: {
    canonical: "/agent",
  },
};

export default async function FinancialAgentPage() {
  const [summaryRes, invoicesRes, toolsRes] = await Promise.all([
    fetchApiResult<FinancialSummaryDto>("/financial/summary"),
    fetchApiResult<readonly InvoiceDto[]>("/financial/invoices?status=unpaid"),
    fetchApiResult<readonly FinancialToolMetadataDto[]>("/financial/tools"),
  ]);

  if (summaryRes.status === "error" && invoicesRes.status === "error") {
    return (
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <ErrorState
          title={summaryRes.isStarting ? "Starting secure service" : "Secure service unavailable"}
          message={
            summaryRes.isStarting
              ? "Neolith is reconnecting. This can take a moment after inactivity on hosted services."
              : "We couldn't reach Neolith's secure service. Please verify your connection or try again."
          }
          isStarting={summaryRes.isStarting}
          details={summaryRes.error}
        />
      </div>
    );
  }

  const summary = summaryRes.status === "success" ? summaryRes.data : FALLBACK_SUMMARY;
  const unpaidInvoices = invoicesRes.status === "success" ? invoicesRes.data : [];
  const tools = toolsRes.status === "success" ? toolsRes.data : FALLBACK_TOOLS;

  return (
    <AgentWorkspaceView
      summary={summary}
      unpaidInvoices={unpaidInvoices}
      tools={tools}
      isLiveConnection={summaryRes.status === "success"}
    />
  );
}
