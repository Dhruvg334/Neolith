import type { Metadata } from "next";
import { AdoptClient } from "@/components/AdoptClient";

export const metadata: Metadata = {
  title: "Enterprise Adoption Guide",
  description:
    "10-stage implementation roadmap, threat modeling, and deployment checklist for integrating Neolith into enterprise environments.",
  alternates: {
    canonical: "/adopt",
  },
};

export default function AdoptPage() {
  return <AdoptClient />;
}
