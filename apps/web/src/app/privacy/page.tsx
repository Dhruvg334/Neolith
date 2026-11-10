import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy — Neolith",
  description:
    "Data handling, cryptographic integrity, and privacy principles governing Neolith's agentic financial platform.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">Compliance & Trust</Badge>
          <span className="text-xs text-slate-500 font-mono">Last Updated: November 2026</span>
        </div>
        <h1 className="page-title text-2xl font-bold tracking-tight text-slate-900">
          Privacy Policy
        </h1>
        <p className="page-lead text-slate-600 text-sm mt-1">
          Neolith operates under strict cryptographic data minimization and least-privilege principles,
          ensuring sensitive financial information and credentials are protected at every architectural layer.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="1. Architectural Data Isolation"
          subtitle="How data flows across the 12-layer agentic architecture."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Neolith enforces a structural separation between the <strong>Planning Layer</strong> (LLM reasoning)
            and the <strong>Execution Runtime</strong> (Open Policy Agent and banking integrations). Large
            Language Models are never granted direct write access to financial ledgers, private keys, or bank
            settlement networks.
          </p>
          <p>
            When financial tasks are planned, canonical SHA-256 request digests are computed. Raw payload
            information is evaluated within the deterministic core; LLM reasoning traces only receive sanitized
            summaries of governance outcomes.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="2. Cryptographic Receipts & Immutability"
          subtitle="Audit transparency without exposing private account numbers."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Every action evaluation, human approval, execution permit, and settlement produces a
            tamper-evident <strong>Decision Receipt (F13)</strong>. Receipts are linked using SHA-256 parent hash
            digests forming a verifiable audit chain.
          </p>
          <p>
            Decision receipts record cryptographic hashes of parameters and execution outputs, allowing
            independent third-party auditors to verify ledger integrity without exposing confidential counterparty
            identifiers or credentials.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="3. Multi-Channel Identity & Telemetry"
          subtitle="WhatsApp, Twilio Voice, and Web interaction handling."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Interactions via external channels (Twilio WhatsApp, Twilio Voice / ElevenLabs) are mapped to
            ephemeral channel session tokens. Inbound requests are sanitized and verified against configured
            webhook signatures before processing.
          </p>
          <p>
            Distributed tracing (OpenTelemetry) propagates correlation IDs (<code>X-Trace-Id</code>) across
            all system requests without storing personally identifiable information in unencrypted application logs.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Questions regarding data privacy? Contact: dhruvg.030304@gmail.com</span>
          <Link href="/docs" className="text-teal-700 hover:text-teal-900 font-semibold underline">
            View Technical Architecture &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
}
