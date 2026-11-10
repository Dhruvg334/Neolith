import type { Metadata } from "next";
import { ApprovalsQueueClient } from "@/components/ApprovalsQueueClient";

export const metadata: Metadata = {
  title: "Approval Queue — Neolith",
  description:
    "Human-in-the-loop operational review queue for sensitive and protected financial proposals bound to canonical request hashes.",
  alternates: {
    canonical: "/approvals",
  },
};

export default function ApprovalsPage() {
  return <ApprovalsQueueClient />;
}
