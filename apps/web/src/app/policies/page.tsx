import type { Metadata } from "next";
import { PoliciesClient } from "@/components/PoliciesClient";

export const metadata: Metadata = {
  title: "Policy Configuration",
  description:
    "Enterprise governance profiles, OPA policy rules, spend ceilings, and real-time custom profile configuration.",
  alternates: {
    canonical: "/policies",
  },
};

export default function PoliciesPage() {
  return <PoliciesClient />;
}
