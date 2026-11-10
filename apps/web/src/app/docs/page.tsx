import type { Metadata } from "next";
import { DocsClient } from "@/components/DocsClient";

export const metadata: Metadata = {
  title: "Documentation Hub",
  description:
    "Interactive architecture diagrams, pan/zoom visualizers, protocol sequences, and data models for Neolith.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsPage() {
  return <DocsClient />;
}
