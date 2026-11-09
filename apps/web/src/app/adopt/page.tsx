"use client";

import Link from "next/link";
import { MermaidViewer } from "@/components/MermaidViewer";

const ADOPTION_WORKFLOW_DIAGRAM = `
flowchart TD
    S1["1. Threat Model & Scope"] --> S2["2. Entity & Boundary Definition"]
    S2 --> S3["3. Register Tools & Risk Tiers"]
    S3 --> S4["4. Allocate Budgets & Currencies"]
    S4 --> S5["5. Write OPA Policy Rules"]
    S5 --> S6["6. Attach Multi-Channel Adapters"]
    S6 --> S7["7. Configure Operator Review Gates"]
    S7 --> S8["8. Hash-Linked Audit Integration"]
    S8 --> S9["9. Adversarial Simulation Suites"]
    S9 --> S10["10. Production Gateway Deployment"]

    classDef stage fill:#f8fafc,stroke:#0f766e,stroke-width:2px;
    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10 stage;
`;

export default function AdoptPage() {
  return (
    <div className="space-y-12 py-2 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-3">
          Knowledge Base • Enterprise Adoption
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Adopting Neolith in Your Organisation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          A structured blueprint for deploying autonomous financial AI agents with
          zero implicit authority, deterministic policy boundaries, and enterprise controls.
        </p>
      </div>

      {/* Section 1: When to Use Neolith */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          When to Use Neolith
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <div className="text-teal-700 font-bold text-sm">
              ✓ High-Stakes Autonomous Operations
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an AI agent is tasked with real-world side effects—such as paying vendor invoices,
              transferring capital, procuring services, or updating account credentials—and cannot be
              allowed to execute unilaterally without deterministic policy gates.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <div className="text-teal-700 font-bold text-sm">
              ✓ Regulatory & Treasury Compliance
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When internal audit, risk committees, or regulators require cryptographic proof,
              traceability, and non-repudiation for every machine-generated action proposal through
              hash-linked audit receipts.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <div className="text-teal-700 font-bold text-sm">
              ✓ Multi-Channel Operator Interactions
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When team members interact with the agent across diverse interfaces (Web workspace,
              WhatsApp business channels, telephony voice conversations) while demanding 100%
              governance parity across all channels.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <div className="text-teal-700 font-bold text-sm">
              ✓ Configurable Risk Tolerance
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When different business units require varying autonomy levels (e.g. strict control for
              treasury write actions, balanced control for accounts payable, high autonomy for routine
              cloud resource scaling).
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Platform Baseline vs Organisation Policy */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Governance Baseline vs. Organisation Policy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Understanding the two-tier governance architecture ensures safety without sacrificing flexibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <span className="inline-block rounded bg-slate-800 text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              1. Platform Governance Baseline
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              Immutable hard invariants enforced across all profiles. These rules cannot be relaxed
              or bypassed by any organisation policy:
            </p>
            <ul className="list-inside list-disc text-xs text-slate-600 space-y-1">
              <li>Emergency kill-switch stops all execution instantly</li>
              <li>Agent version manifest must match registered SHA-256 digest</li>
              <li>Tools must be registered, active, and bound to capabilities</li>
              <li>Unverified vendor payments are unconditionally denied</li>
              <li>Category budget exhaustion triggers hard DENY</li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-3">
            <span
              className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "#F97316" }}
            >
              2. Adaptive Organisation Policy
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              Configurable operational rules tailored to your team&apos;s risk tolerance:
            </p>
            <ul className="list-inside list-disc text-xs text-slate-600 space-y-1">
              <li>Approval thresholds for high-value actions (e.g. INR 25,000.00)</li>
              <li>Profile selection (Strict Control, Balanced, High Autonomy)</li>
              <li>Custom operation review lists (e.g. require human sign-off for fund transfers)</li>
              <li>Per-category monthly spending caps and budget reservations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: 10-Step Implementation Journey */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            The 10-Step Adoption Journey
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            From initial threat modeling to production runtime deployment.
          </p>
        </div>

        <div className="mb-6">
          <MermaidViewer
            chart={ADOPTION_WORKFLOW_DIAGRAM}
            title="Figure: 10-Step Organisation Adoption Workflow"
          />
        </div>

        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "Threat Modeling & Operational Boundary",
              desc: "Identify sensitive financial transactions, payment limits, and potential failure modes. Establish that the agent will reason and propose, but never directly hold banking credentials.",
            },
            {
              step: "02",
              title: "Entity & Identity Architecture",
              desc: "Define distinct cryptographic principals for users, agent instances, and tools. Ensure no shared service accounts or ambient authority.",
            },
            {
              step: "03",
              title: "Tool Manifest Registration & Risk Tiering",
              desc: "Register every tool with an explicit OpenAPI/JSON schema, reversibility classification, and risk tier (R1 read-only to R4 irreversible write).",
            },
            {
              step: "04",
              title: "Budget Allocation & Category Caps",
              desc: "Configure departmental or category budgets with explicit currency, limit amounts, and human approval thresholds.",
            },
            {
              step: "05",
              title: "Policy Formulation with OPA Rego",
              desc: "Express access control, spending invariants, and review conditions as deterministic, testable Rego policies.",
            },
            {
              step: "06",
              title: "Multi-Channel Adapter Configuration",
              desc: "Connect your organisation's communication endpoints (Web, WhatsApp Twilio webhook, ElevenLabs voice) to the interaction gateway.",
            },
            {
              step: "07",
              title: "Operator Review & Escalation Workflow",
              desc: "Establish operational procedures for reviewing actions flagged with REVIEW status (e.g. threshold breaches).",
            },
            {
              step: "08",
              title: "Audit & Decision Receipt Storage",
              desc: "Integrate PostgreSQL or tamper-evident storage to persist hash-linked execution requests, policy evaluation inputs, and signed decision receipts.",
            },
            {
              step: "09",
              title: "Adversarial Simulation & Regression Testing",
              desc: "Execute automated verification suites validating that unauthorized amounts, inactive tools, and unverified vendors are rejected 100% of the time.",
            },
            {
              step: "10",
              title: "Production Gateway Deployment & Monitoring",
              desc: "Deploy the containerized Neolith control plane with OpenTelemetry tracing, Prometheus metrics, and automated health checks.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                {item.step}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="rounded-2xl border border-slate-800 bg-[#0B1F33] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Ready to inspect the architecture?</h3>
          <p className="text-xs text-slate-300">
            Explore interactive diagrams, sequence specifications, and schema definitions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0F766E" }}
          >
            Open Documentation Hub →
          </Link>
          <Link
            href="/agent"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Test Financial Agent
          </Link>
        </div>
      </section>
    </div>
  );
}
