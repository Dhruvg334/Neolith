import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Service — Neolith",
  description:
    "Governance agreements, execution authority limits, and operator responsibilities for Neolith platform.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">Terms & Governance</Badge>
          <span className="text-xs text-slate-500 font-mono">Version 1.0 · November 2026</span>
        </div>
        <h1 className="page-title text-2xl font-bold tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="page-lead text-slate-600 text-sm mt-1">
          Operating rules and governance boundaries governing enterprise deployment and autonomous agent
          operations within the Neolith runtime.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="1. Scope of Agent Autonomy"
          subtitle="Non-bypassable runtime invariant enforcement."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Neolith AI agents operate solely in an advisory, planning, and proposal capacity. Agents possess
            <strong> zero autonomous execution privileges</strong> over protected financial tools or treasury assets
            without an explicit, cryptographically signed <strong>Execution Permit (F09)</strong> issued by the
            authoritative Open Policy Agent (OPA) runtime.
          </p>
          <p>
            Any action proposals that exceed configured profile thresholds, involve unverified beneficiaries,
            or fail category budget checks are held in an <code>awaiting_approval</code> state for human authorization.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="2. Human Operator Responsibilities"
          subtitle="Human Checkpoints (F08) and authorization obligations."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Operators authorized with the <code>approver</code> or <code>operator</code> role bear primary
            responsibility for reviewing proposed actions held in the Operational Approval Queue. Approving an
            action signs the canonical SHA-256 request digest and triggers irrevocable banking settlement.
          </p>
          <p>
            Operators may utilize the emergency kill-switch at <code>/operator</code> at any time to immediately
            revoke all outstanding execution permits and halt background agent scheduling across the cluster.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="3. Open Source & Licensing"
          subtitle="Apache 2.0 License conditions."
        />
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed mt-2">
          <p>
            Neolith is published under the Apache 2.0 Open Source License. While the governance runtime provides
            rigorous deterministic enforcement, deployers are responsible for auditing policy rego files and
            securing their production database and API credentials.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Governance questions? Contact: dhruvg.030304@gmail.com</span>
          <Link href="/security" className="text-teal-700 hover:text-teal-900 font-semibold underline">
            View Security Architecture &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
}
