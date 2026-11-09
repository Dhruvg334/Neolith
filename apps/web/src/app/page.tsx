import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="rounded-2xl border border-slate-800 bg-[#0B1F33] px-8 py-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Zero Implicit Authority Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Deterministic Governance for Autonomous Financial AI Agents
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Neolith separates intelligent financial goal understanding, vendor evaluation,
            and action planning from deterministic execution authority. Every agent proposal
            must satisfy authoritative Open Policy Agent (OPA) rules, budget thresholds, and
            identity verification before any transaction is executed.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/agent"
              className="rounded-lg px-5 py-3 text-sm font-bold text-white transition-all shadow-md hover:opacity-90 hover:-translate-y-0.5"
              style={{ backgroundColor: "#0F766E" }}
            >
              Open Financial Agent →
            </Link>
            <Link
              href="/governance"
              className="rounded-lg px-5 py-3 text-sm font-bold text-white transition-all shadow-md hover:opacity-90 hover:-translate-y-0.5"
              style={{ backgroundColor: "#F97316" }}
            >
              Explore Governance Workspace
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              Read Documentation Hub
            </Link>
            <Link
              href="/adopt"
              className="rounded-lg border border-teal-600/40 bg-teal-950/40 px-5 py-3 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-900/60"
            >
              Adoption Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Three Architectural Layers of Autonomous Safety
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Engineered to eliminate unilateral agent risk across enterprise treasury and accounts payable workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded">
                Layer 1: Reasoning
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Tier R1</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Autonomous Financial Agent
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyzes incoming operator goals, reads invoices, audits category spend against budgets,
              and prepares structured financial action proposals. Operates with zero direct payment credentials.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow border-t-4" style={{ borderTopColor: "#F97316" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-1 rounded">
                Layer 2: Governance Gateway
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Tier R3</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Authoritative Policy Runtime
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates hard policy invariants, cryptographic agent identity, capability bindings,
              budget feasibility, and active profile thresholds via compiled OPA Rego rules.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                Layer 3: Enterprise Services
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Tier R2</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Protected Banking Execution
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Executes ledger disbursements and transfers strictly upon receipt of valid governance
              evaluations and human approvals, appending immutable hash-linked decision receipts.
            </p>
          </div>
        </div>
      </section>

      {/* Canonical Scenarios Walkthrough */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Canonical Governance Scenarios
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic evaluations demonstrating policy-driven outcomes under the default Balanced Control profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-001</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800">
                ALLOW
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Routine Cloud SaaS</h4>
            <p className="text-xs text-slate-600">
              Amount: <strong>INR 4,200.00</strong> (Software Category). Verified vendor Acme Cloud, within category cap and approval threshold.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-800">
              ✓ BASE_POLICY_ALLOW
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-002</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase text-amber-800">
                REVIEW
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">High-Value Infrastructure</h4>
            <p className="text-xs text-slate-600">
              Amount: <strong>INR 32,000.00</strong> (Infrastructure Category). Verified vendor, within category cap but reaches operator approval threshold.
            </p>
            <div className="pt-2 text-[11px] font-mono text-amber-800">
              ⚠ APPROVAL_THRESHOLD_REACHED
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">INV-003</span>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold uppercase text-red-800">
                DENY
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Unverified Hardware Invoice</h4>
            <p className="text-xs text-slate-600">
              Amount: <strong>INR 85,000.00</strong> (Miscellaneous Category). Dual invariant violation: unverified vendor directory match and category cap breach.
            </p>
            <div className="pt-2 text-[11px] font-mono text-red-800">
              ✗ BUDGET_EXCEEDED • UNVERIFIED_BENEFICIARY
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/agent"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
        >
          <div className="text-teal-700 font-bold text-sm mb-1 group-hover:text-teal-900 flex items-center justify-between">
            <span>Financial Agent</span>
            <span>→</span>
          </div>
          <p className="text-xs text-slate-500">
            Natural language interface with visual governance boundary and proposal generation.
          </p>
        </Link>

        <Link
          href="/governance"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-600 hover:shadow-md transition-all group"
        >
          <div className="text-amber-800 font-bold text-sm mb-1 group-hover:text-amber-900 flex items-center justify-between">
            <span>Governance Workspace</span>
            <span>→</span>
          </div>
          <p className="text-xs text-slate-500">
            Live decision telemetry, outcome distributions, active profile inspection, and audit drawer.
          </p>
        </Link>

        <Link
          href="/policies"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-600 hover:shadow-md transition-all group"
        >
          <div className="text-teal-700 font-bold text-sm mb-1 group-hover:text-teal-900 flex items-center justify-between">
            <span>Policy Profiles</span>
            <span>→</span>
          </div>
          <p className="text-xs text-slate-500">
            Switch between Strict, Balanced, and High Autonomy, or configure custom threshold builders.
          </p>
        </Link>

        <Link
          href="/docs"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-800 hover:shadow-md transition-all group"
        >
          <div className="text-slate-800 font-bold text-sm mb-1 group-hover:text-black flex items-center justify-between">
            <span>Documentation Hub</span>
            <span>→</span>
          </div>
          <p className="text-xs text-slate-500">
            Interactive Mermaid architecture diagrams, pan/zoom controls, and system specifications.
          </p>
        </Link>
      </section>
    </div>
  );
}
