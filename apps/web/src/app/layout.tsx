import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://neolith.local"),
  title: {
    default: "Neolith — AI-Powered Agentic Decision and Execution System",
    template: "%s — Neolith",
  },
  description:
    "Enterprise agentic AI system separating intelligent planning from governed execution authority. OPA v1.22.2 policy invariants, execution permits, and hash-linked decision receipts.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
