import type { Metadata } from "next";
import { GovernanceClient } from "@/components/GovernanceClient";

export const metadata: Metadata = {
  title: "Governance Runtime",
  description:
    "Authoritative OPA policy decision inspector, permission bindings, active profile controls, and evaluation audit traces.",
  alternates: {
    canonical: "/governance",
  },
};

export default function GovernancePage() {
  return <GovernanceClient />;
}
