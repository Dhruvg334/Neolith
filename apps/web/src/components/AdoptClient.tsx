"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  BookOpen,
  Bot,
  Compass,
} from "lucide-react";

interface Phase {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  steps: {
    step: string;
    title: string;
    desc: string;
    deliverable: string;
  }[];
}

const ADOPTION_PHASES: Phase[] = [
  {
    id: "phase-1",
    number: "Phase 1",
    title: "Scope & Identity Architecture",
    subtitle: "Establish trust boundaries and cryptographic principals before granting any agent access.",
    duration: "Week 1",
    steps: [
      {
        step: "01",
        title: "Threat Modeling & Operational Boundary",
        desc: "Identify sensitive financial transactions, payment thresholds, and potential failure modes. Establish that the AI agent reasons and proposes, but never directly holds bank accounts or payment keys.",
        deliverable: "Threat boundary matrix & allowed transaction list",
      },
      {
        step: "02",
        title: "Entity & Identity Architecture",
        desc: "Define distinct cryptographic principals for users, agent instances, and tools. Ensure no shared service accounts, API keys, or ambient authority exist anywhere in the pipeline.",
        deliverable: "Cryptographic agent manifest & service identity specs",
      },
    ],
  },
  {
    id: "phase-2",
    number: "Phase 2",
    title: "Policies, Budgets & Risk Caps",
    subtitle: "Define deterministic guardrails, spending ceilings, and tool classifications.",
    duration: "Week 2",
    steps: [
      {
        step: "03",
        title: "Tool Registration & Risk Tiering",
        desc: "Register every tool with an explicit contract schema and risk tier (R1 read-only context to R4 irreversible financial settlement).",
        deliverable: "Registered tools catalog & risk classification policy",
      },
      {
        step: "04",
        title: "Budget Allocation & Category Caps",
        desc: "Configure departmental or category budgets with explicit currency limits, reserve amounts, and mandatory human review thresholds.",
        deliverable: "Monthly category spend ceilings & threshold policies",
      },
      {
        step: "05",
        title: "Policy Formulation with OPA Rego",
        desc: "Express access control, spending invariants, and review conditions as deterministic, testable Open Policy Agent rules.",
        deliverable: "Tested OPA Rego policy packages (neolith.rego)",
      },
    ],
  },
  {
    id: "phase-3",
    number: "Phase 3",
    title: "Channel Adapters & Approvals",
    subtitle: "Connect your workspace communication channels and human sign-off escalation queues.",
    duration: "Week 3",
    steps: [
      {
        step: "06",
        title: "Channel Adapter Configuration",
        desc: "Connect your organisation's communication endpoints (Web console, with Twilio mobile dispatch and Conversational Financial Agent in staged development) to the interaction gateway.",
        deliverable: "Authenticated interaction gateway endpoints",
      },
      {
        step: "07",
        title: "Operator Review & Escalation Workflow",
        desc: "Establish operational procedures for finance managers reviewing actions flagged with REVIEW status (e.g. transactions exceeding review thresholds).",
        deliverable: "Human-in-the-loop escalation SOPs & approval roles",
      },
      {
        step: "08",
        title: "Tamper-Evident Receipt Ledger",
        desc: "Connect tamper-evident storage to persist hash-linked execution requests, policy evaluation inputs, and cryptographically signed decision receipts.",
        deliverable: "Append-only immutable audit trail integration",
      },
    ],
  },
  {
    id: "phase-4",
    number: "Phase 4",
    title: "Verification & Production Go-Live",
    subtitle: "Execute automated adversarial simulations and safely launch the governed runtime.",
    duration: "Week 4",
    steps: [
      {
        step: "09",
        title: "Adversarial Simulation & Regression Suites",
        desc: "Run automated security test suites validating that unverified vendors, spending limit breaches, and tampered proposals are blocked 100% of the time.",
        deliverable: "Security assurance report & invariant verification logs",
      },
      {
        step: "10",
        title: "Production Runtime Deployment & Monitoring",
        desc: "Deploy the containerized Neolith control plane with distributed tracing, latency telemetry, and emergency kill-switch readiness.",
        deliverable: "Live enterprise deployment & 24/7 operator controls",
      },
    ],
  },
];

export function AdoptClient() {
  const [activePhaseId, setActivePhaseId] = useState<string>("all");

  const displayedPhases =
    activePhaseId === "all"
      ? ADOPTION_PHASES
      : ADOPTION_PHASES.filter((p) => p.id === activePhaseId);

  return (
    <div className="space-y-12 py-2 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-3">
          <Compass className="w-3.5 h-3.5" />
          Enterprise Adoption Roadmap
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Adopting Neolith in Your Organisation
        </h1>
        <p className="text-base font-bold text-teal-800 mt-2">
          Neolith provides the governance control layer. Your organisation decides the rules.
        </p>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
          A clear, 4-phase structured journey for deploying autonomous financial AI agents with
          zero direct payment authority, deterministic budget boundaries, and manager sign-off controls.
        </p>
      </div>

      {/* Section 1: When to Use Neolith */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          When Does Your Organisation Need Neolith?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="text-teal-700 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>High-Stakes Autonomous Operations</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              When an AI agent is tasked with real-world side effects—such as paying vendor invoices,
              transferring treasury funds, or purchasing cloud infrastructure—and cannot be allowed to
              execute unilaterally without strict corporate approval rules.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="text-teal-700 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Treasury & Regulatory Compliance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              When internal risk committees, finance executives, or external auditors require cryptographic
              proof, traceability, and complete non-repudiation for every machine-generated financial proposal.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="text-teal-700 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Multi-Channel Communication Safety</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              When employees interact with the financial assistant across multiple interfaces (Web console,
              mobile alerts, or voice dialogues) while requiring 100% identical policy enforcement across all channels.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="text-teal-700 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Configurable Risk Profiles</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              When different departments demand varying autonomy levels (e.g. Strict Control for treasury
              disbursements, Balanced Control for verified software subscriptions, High Autonomy for routine cloud scaling).
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Platform Baseline vs Organisation Policy */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Baseline vs. Organisation Policy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Understanding the two-tier governance architecture ensures safety without sacrificing flexibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-900 text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                1. Platform Baseline Invariants
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed m-0">
              Non-negotiable core rules enforced across every profile. These protect your organization and cannot be relaxed:
            </p>
            <ul className="list-inside list-disc text-xs text-slate-600 space-y-1.5 pt-1">
              <li>Emergency kill-switch immediately halts all execution cluster-wide</li>
              <li>Agent identity and version manifest must be registered and active</li>
              <li>Unverified vendors are unconditionally rejected</li>
              <li>Transactions that exceed committed category budgets trigger a hard block</li>
              <li>All writes require single-use, 60-second cryptographic permits</li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "#F97316" }}
              >
                2. Adaptive Organisation Policy
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed m-0">
              Customizable rules tailored to your team&apos;s operational risk tolerance:
            </p>
            <ul className="list-inside list-disc text-xs text-slate-600 space-y-1.5 pt-1">
              <li>Custom approval thresholds (e.g. require human sign-off above ₹25,000)</li>
              <li>Active policy profile selection (Strict Control, Balanced, High Autonomy)</li>
              <li>Custom operation review lists (e.g. fund transfers, batch payroll)</li>
              <li>Departmental monthly spend limits and budget reservations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: 4-Phase Adoption Roadmap (Clean, interactive stepper - NO giant clunky graph!) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              The 4-Phase Implementation Journey
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Step-by-step roadmap from initial threat scoping to production deployment.
            </p>
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivePhaseId("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activePhaseId === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Phases
            </button>
            {ADOPTION_PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhaseId(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activePhaseId === p.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p.number}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Cards */}
        <div className="space-y-6">
          {displayedPhases.map((phase) => (
            <div
              key={phase.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
            >
              {/* Phase Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs font-mono">
                    {phase.number}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {phase.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">{phase.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 shrink-0 self-start sm:self-auto">
                  Timeline: {phase.duration}
                </span>
              </div>

              {/* Steps inside Phase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phase.steps.map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                          Step {item.step}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 m-0">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Deliverable:</span>
                      <span>{item.deliverable}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-2xl border border-slate-800 bg-[#070B16] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Ready to inspect the architecture?</h3>
          <p className="text-xs text-slate-400 m-0">
            Explore interactive sequence diagrams, contract schemas, and policy definitions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/docs"
            className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-glow transition-all hover:bg-teal-600 bg-teal-700 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Documentation Hub</span>
          </Link>
          <Link
            href="/agent"
            className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Test Financial Agent</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
