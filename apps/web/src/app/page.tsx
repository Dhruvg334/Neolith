import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Neolith — AI-Powered Agentic Decision and Execution System",
  description:
    "Deterministic governance for autonomous financial AI agents separating intelligent planning from governed execution authority.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* 1. Hero Section */}
      <section className="rounded-2xl border border-slate-800 bg-[#0B1F33] px-8 py-14 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            Zero Implicit Authority Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Separating AI Thinking from Financial Doing
          </h1>

          <p className="text-xl font-bold text-teal-300">
            Neolith provides the governance control layer. Your organisation decides the rules.
          </p>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            Giving an autonomous AI agent direct access to bank accounts and corporate systems is inherently dangerous.
            Neolith introduces an authoritative <strong>Governance Runtime Gateway</strong> between AI reasoning and real-world execution.
            Agents can freely read, research, and propose actions—but they hold <strong>zero direct payment authority</strong>.
            Every transaction is verified by deterministic Open Policy Agent (OPA) rules, budget ceilings, human review checkpoints,
            and single-use execution permits.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/agent"
              className="rounded-lg px-6 py-3.5 text-sm font-bold text-white transition-all shadow-lg hover:opacity-95 hover:-translate-y-0.5"
              style={{ backgroundColor: "#0F766E" }}
            >
              Open Financial Agent Console →
            </Link>
            <Link
              href="/approvals"
              className="rounded-lg px-6 py-3.5 text-sm font-bold text-white transition-all shadow-lg hover:opacity-95 hover:-translate-y-0.5"
              style={{ backgroundColor: "#F97316" }}
            >
              Human Approvals Queue
            </Link>
            <Link
              href="/operator"
              className="rounded-lg border border-slate-600 bg-slate-800/90 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              Operator Control Plane
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-teal-600/40 bg-teal-950/40 px-6 py-3.5 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-900/60"
            >
              Documentation Hub
            </Link>
          </div>
        </div>
      </section>

      {/* 2. The Core Problem: Why Agents Need a Vault Guard */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
            The Fundamental Security Dilemma
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Traditional AI Agents vs. Neolith Architecture
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Why direct tool access fails in enterprise treasury, and how deterministic governance solves it.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="py-3.5 px-5 font-bold">Security Dimension</th>
                <th className="py-3.5 px-5 font-bold text-red-700 bg-red-50/50">Traditional Autonomous Agent</th>
                <th className="py-3.5 px-5 font-bold text-teal-800 bg-teal-50/50">Neolith Governed System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Authority Model</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Ambient authority; agent holds direct API credentials and signs payouts unilaterally.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>Zero ambient authority.</strong> Agent only creates proposals; execution requires independent permits.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Prompt Injection Defense</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Vulnerable; poisoned invoice text can trick the LLM into rerouting funds to shadow accounts.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>Deterministic policy gate.</strong> Unverified vendor IDs are blocked by OPA Rego rules before tool execution.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Budget & Quotas</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Uncontrolled; concurrent tasks can execute overlapping disbursements until balance is depleted.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>Atomic category budgets.</strong> Limits checked and reserved dynamically; breaches trigger immediate denial.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Human Checkpoints</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Ad-hoc or absent; either everything requires manual approval or the agent runs unassisted.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>Policy-driven routing.</strong> Routine actions auto-allow; high-value/risk actions halt in human review queue.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Execution Token</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Static banking API keys stored in agent memory or worker environment.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>60-second single-use Execution Permits</strong> bound to canonical parameter SHA-256 digests.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-800">Audit & Accountability</td>
                <td className="py-3.5 px-5 text-red-700 bg-red-50/20">
                  Ephemeral unstructured logs; difficult to prove whether the model was compromised.
                </td>
                <td className="py-3.5 px-5 text-teal-900 bg-teal-50/20 font-medium">
                  <strong>Tamper-evident Decision Receipts.</strong> Append-only cryptographic hash chain permanently records all decisions.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. The 4-Step Governed Execution Lifecycle */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
            Execution Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How Neolith Executes Every Financial Action
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            From natural language user intent to cryptographically verified banking settlement in four deterministic stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">Unprivileged</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Reasoning & Planning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The agent reads user intent, inspects invoice line items, verifies accounts, and formats a typed
              <code className="inline-code ml-1">FinancialActionProposal</code>. The agent cannot disburse funds.
            </p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase text-teal-800">Authoritative</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Policy & Budget Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Governance Runtime evaluates OPA Rego rules, agent registration, category budget limits,
              and vendor verification status to produce an immutable decision: <strong>ALLOW</strong>, <strong>REVIEW</strong>, or <strong>DENY</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase text-amber-900">Human-In-The-Loop</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Human Checkpoint</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Actions exceeding approval thresholds (or triggered under Strict Control) halt in the
              <code className="inline-code ml-1">/approvals</code> queue. Reviewers inspect parameter hashes and approve or reject.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase text-emerald-800">Vault Protected</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Permitted Settlement</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A 60-second single-use Execution Permit authorizes the banking simulator to debit balances,
              mark the invoice paid, and append an immutable hash receipt to the ledger.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Canonical Governance Demonstration Scenarios */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
            Live Demonstration Reference
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Three Canonical Invoices, Three Deterministic Outcomes
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Under Neolith Finance default Balanced Control policy (INR 25,000 Software cap, INR 50,000 Infrastructure cap, INR 10,000 Misc cap).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scenario 1: ALLOW */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-001</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800">
                ALLOW (AUTOMATED)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Acme Cloud SaaS Subscription</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Amount: <strong>INR 8,000.00</strong> (Software Category). Verified vendor Acme Cloud, within remaining software category budget and under review threshold.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-800 space-y-1">
              <div>✓ BASE_POLICY_ALLOW</div>
              <div className="text-[11px] text-slate-500">Auto-mints 60s permit & settles transaction</div>
            </div>
          </div>

          {/* Scenario 2: REVIEW */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-002</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-900">
                REVIEW (HUMAN CHECKPOINT)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Nova Compute Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Amount: <strong>INR 35,000.00</strong> (Infrastructure Category). Verified vendor Nova Compute, within INR 50,000 cap but exceeds INR 25,000 operator review threshold.
            </p>
            <div className="pt-2 text-xs font-mono text-amber-900 space-y-1">
              <div>⚠ APPROVAL_REQUIRED</div>
              <div className="text-[11px] text-slate-500">Queued in /approvals for human manager sign-off</div>
            </div>
          </div>

          {/* Scenario 3: DENY */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-003</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-800">
                DENY (HARD REJECTION)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Unknown Supplies Ad-Hoc Hardware</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Amount: <strong>INR 75,000.00</strong> (Miscellaneous Category). Dual invariant violation: vendor is unverified and amount breaches INR 10,000 category ceiling.
            </p>
            <div className="pt-2 text-xs font-mono text-red-800 space-y-1">
              <div>✗ BUDGET_EXCEEDED</div>
              <div>✗ UNVERIFIED_BENEFICIARY</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Complete Platform Navigation Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Explore the Neolith Platform Experience
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access interactive consoles, governance controls, audit chains, and developer documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/agent"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
          >
            <div className="text-teal-700 font-bold text-sm mb-1.5 group-hover:text-teal-900 flex items-center justify-between">
              <span>Financial Agent</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Conversational financial planner with visual governance boundaries and proposal inspector.
            </p>
          </Link>

          <Link
            href="/approvals"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-600 hover:shadow-md transition-all group"
          >
            <div className="text-amber-800 font-bold text-sm mb-1.5 group-hover:text-amber-900 flex items-center justify-between">
              <span>Approvals Queue</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Human review queue to inspect canonical action hashes, add reviewer notes, and trigger settlement.
            </p>
          </Link>

          <Link
            href="/operator"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-red-600 hover:shadow-md transition-all group"
          >
            <div className="text-red-700 font-bold text-sm mb-1.5 group-hover:text-red-900 flex items-center justify-between">
              <span>Operator Controls</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cluster emergency kill-switch, agent quarantine controls, and F15 Security Assurance Lab.
            </p>
          </Link>

          <Link
            href="/governance"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
          >
            <div className="text-teal-700 font-bold text-sm mb-1.5 group-hover:text-teal-900 flex items-center justify-between">
              <span>Governance Telemetry</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live decision telemetry, outcome distributions, active profile banner, and audit drawer.
            </p>
          </Link>

          <Link
            href="/policies"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
          >
            <div className="text-teal-700 font-bold text-sm mb-1.5 group-hover:text-teal-900 flex items-center justify-between">
              <span>Policy Profiles</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Switch dynamically between Strict, Balanced, and High Autonomy, or build custom thresholds.
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
          >
            <div className="text-teal-700 font-bold text-sm mb-1.5 group-hover:text-teal-900 flex items-center justify-between">
              <span>Treasury Dashboard</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Operating account balance, unpaid invoice counters, monthly spend meters, and ledger history.
            </p>
          </Link>

          <Link
            href="/adopt"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
          >
            <div className="text-teal-700 font-bold text-sm mb-1.5 group-hover:text-teal-900 flex items-center justify-between">
              <span>Adoption Guide</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Phased 10-step enterprise rollout guide from discovery to zero-ambient-authority go-live.
            </p>
          </Link>

          <Link
            href="/docs"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-800 hover:shadow-md transition-all group"
          >
            <div className="text-slate-800 font-bold text-sm mb-1.5 group-hover:text-black flex items-center justify-between">
              <span>Documentation Hub</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Interactive zoomable Mermaid diagrams, technical specifications, and API contract references.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
