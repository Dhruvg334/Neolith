import type { Metadata } from "next";
import { ReferenceConsoleView } from "@/components/ReferenceConsoleView";

export const metadata: Metadata = {
  title: "Neolith — Redesign Fleet Preview & Command Center",
  description:
    "Next-generation enterprise agentic AI command center separating intelligent planning from governed execution authority. OPA v1.22.2 policy invariants, execution permits, and decision receipts.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <ReferenceConsoleView />;
}
