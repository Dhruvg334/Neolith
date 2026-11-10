import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Security Architecture — Neolith",
  description:
    "Security architecture, policy invariants, and cryptographic guarantees protecting Neolith financial operations.",
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="allow">Defense in Depth</Badge>
          <span className="text-xs text-slate-500 font-mono">12-Layer System Architecture</span>
        </div>
        <h1 className="page-title text-2xl font-bold tracking-tight text-slate-900">
          Security Architecture & Policy Invariants
        </h1>
        <p className="page-lead text-slate-600 text-sm mt-1">
          How Neolith mathematically enforces separation between untrusted AI cognitive planning and
          deterministic financial execution authority.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="The Five Non-Negotiable Invariants"
          subtitle="Hard architectural constraints implemented at the kernel of Neolith."
        />
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 text-xs block mb-1">
              INV-1: No Autonomous Write Execution Without Valid Permit
            </span>
            <p className="text-xs text-slate-600">
              Tools marked with <code>protected=true</code> or <code>read_only=false</code> cannot be executed
              by any agent directly. A short-lived, single-use Execution Permit (F09) bound to the SHA-256
              parameter hash must be presented and verified before execution proceeds.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 text-xs block mb-1">
              INV-2: Single Authoritative Policy Engine
            </span>
            <p className="text-xs text-slate-600">
              Open Policy Agent (OPA v1.22.2) is the sole authority for policy decisions. The application
              never evaluates permissions via client heuristics or loose prompt instructions. In the event of
              an OPA outage, the system fails closed (<code>FAIL_CLOSED</code>), denying all sensitive actions.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 text-xs block mb-1">
              INV-3: Canonical Parameter & Context Hashing
            </span>
            <p className="text-xs text-slate-600">
              All proposals are converted to deterministic JSON and hashed with SHA-256. A permit issued for
              hash <code>h1</code> cannot be consumed for action <code>h2</code>, eliminating parameter tampering
              and prompt injection elevation vulnerabilities.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 text-xs block mb-1">
              INV-4: Instant Revocation & Cluster Kill-Switch
            </span>
            <p className="text-xs text-slate-600">
              A monotonic revocation epoch stored in the database immediately invalidates all outstanding
              permits when incremented. Activating the emergency kill-switch halts all agent workflows cluster-wide.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 text-xs block mb-1">
              INV-5: Tamper-Evident Append-Only Receipts
            </span>
            <p className="text-xs text-slate-600">
              Every decision, permit issuance, and settlement is written to an append-only receipt log with
              parent-hash linkage. The cryptographic integrity of the entire chain can be audited mathematically
              via <code>GET /api/v1/receipts/verify</code>.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Layer 10: Secret Isolation & Environment Security"
          subtitle="Credential hygiene across hosted and local deployments."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Per the Agentic Web Development Handbook, no API secrets, database passwords, or Twilio tokens
            are ever exposed to client bundles or logged in telemetry. Client-side code only receives
            non-sensitive configuration (such as public feature flags and channel indicators).
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Security reporting: dhruvg.030304@gmail.com</span>
          <Link href="/governance" className="text-teal-700 hover:text-teal-900 font-semibold underline">
            Inspect Live Governance Policies &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
}
