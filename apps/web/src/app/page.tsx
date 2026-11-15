import type { Metadata } from "next";
import { LandingPageClient } from "@/components/LandingPageClient";

export const metadata: Metadata = {
  title: "Neolith — AI-Powered Agentic Decision and Execution System",
  description:
    "Deterministic governance runtime for financial AI agents separating intelligent planning from governed execution authority. OPA v1.22.2 policy invariants, short-lived permits, and cryptographic decision receipts.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
