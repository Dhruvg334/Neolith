import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Target,
  Sparkles,
  MessageSquare,
  Mic,
  ArrowRight,
  Lock,
  Building,
  Cpu,
} from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "About the Team & Major Project",
  description:
    "Final Year Major Project at KIIT University exploring deterministic governance and zero implicit authority for financial AI agents.",
  alternates: {
    canonical: "/about",
  },
};

interface TeamMember {
  readonly name: string;
  readonly role: string;
  readonly focus: string;
}

const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    name: "Dhruv Gupta",
    role: "Project Lead & Core Systems Architecture",
    focus: "Governance Runtime Gateway, OPA Rego Invariants & Distributed State",
  },
  {
    name: "Akkshita Isa",
    role: "Systems Research & Policy Engineering",
    focus: "Deterministic Policy Design, Audit Receipts & Cryptographic Permits",
  },
  {
    name: "Akshhaya Isa",
    role: "Full-Stack Development & Verification",
    focus: "Flight Deck Interface, API Integration & Quality Gate Validation",
  },
  {
    name: "Shubhangini Mehta",
    role: "Security Analysis & Compliance Modeling",
    focus: "EU AI Act Compliance, Prompt Injection Hardening & Risk Telemetry",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 px-4 sm:px-6">
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
          <GraduationCap className="w-4 h-4 text-ember-500" />
          <span>KIIT University &bull; Major Project</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight m-0">
          About Neolith &amp; The Engineering Team
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Developed as our Final Year Major Project at Kalinga Institute of Industrial Technology (KIIT),
          Neolith investigates the fundamental challenge of autonomous enterprise AI:
          <strong> separating AI reasoning from financial execution authority</strong>.
        </p>
      </div>

      {/* 2. SUPERVISOR RECOGNITION BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ember-400 block">
              Project Guidance &amp; Faculty Supervision
            </span>
            <h2 className="text-xl font-bold text-slate-100 m-0">
              Prof. N Sangita Achary
            </h2>
            <p className="text-xs text-slate-400 m-0">
              School of Computer Engineering, KIIT Deemed to be University, Bhubaneswar, Odisha
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            Academic Year 2025–2026
          </div>
        </div>
      </div>

      {/* 3. TEAM MEMBERS GRID */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <Users className="w-5 h-5 text-ember-500" />
            <span>Core Development Team</span>
          </h2>
          <p className="text-xs text-slate-600 m-0 mt-0.5">
            Undergraduate researchers in the School of Computer Engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <Card key={member.name}>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 m-0 leading-snug">
                    {member.name}
                  </h3>
                  <span className="text-xs font-semibold text-ember-600 block mt-0.5">
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed m-0 pt-1 border-t border-slate-100">
                  {member.focus}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. WHY NEOLITH WAS MADE (THE CORE PROBLEM) */}
      <Card>
        <CardHeader
          title="Why Neolith Was Made (The Problem Space)"
          subtitle="Addressing the inherent vulnerability of autonomous AI agents in high-consequence enterprise environments."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs leading-relaxed text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Prompt Injections</span>
            </div>
            <p className="m-0 text-slate-600">
              When AI models are given direct access to corporate bank accounts or procurement APIs,
              malicious text inside third-party invoices can hijack the agent&apos;s planning logic.
              Neolith blocks this by making execution structurally impossible without independent permits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Target className="w-4 h-4 text-amber-600" />
              <span>Hallucinated Numbers</span>
            </div>
            <p className="m-0 text-slate-600">
              Probabilistic language models occasionally hallucinate decimal places or confuse currency units.
              Neolith bounds all agent proposals with deterministic Open Policy Agent (OPA) invariants and
              atomic category budget locks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Zero Implicit Authority</span>
            </div>
            <p className="m-0 text-slate-600">
              Under Neolith, agents hold zero signing keys and zero payment credentials.
              They can research, compare, and propose—but every debit requires a cryptographically
              signed, single-use Ed25519 execution permit minted by independent governance.
            </p>
          </div>
        </div>
      </Card>

      {/* 5. FUTURE SCOPE & EXTERNAL ADAPTERS (WHATSAPP, ELEVENLABS & BEYOND) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ember-500" />
            <span>Future Scope &amp; Next Horizons</span>
          </h2>
          <p className="text-xs text-slate-600 m-0 mt-0.5">
            Planned multi-channel adapters, enterprise integrations, and roadmap expansions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">
                      Mobile Messaging Dispatch (Twilio Adapter)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      SMS &amp; WhatsApp Inbound Gateway
                    </span>
                  </div>
                </div>
                <Badge variant="review">In Development</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Enables remote treasury managers to receive real-time transaction proposal alerts on WhatsApp or SMS,
                review parameter diffs, and authorize dual-key disbursements asynchronously with cryptographic HMAC signatures.
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">
                      Conversational Voice Agent (ElevenLabs Integration)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Low-Latency Speech-to-Action
                    </span>
                  </div>
                </div>
                <Badge variant="review">In Development</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Provides a bidirectional conversational voice stream for hands-free treasury inquiries, oral invoice reviews,
                and voice biometric authentication before submitting proposals to the Neolith Gateway.
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">
                      Enterprise ERP Connectors
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      SAP S/4HANA, NetSuite &amp; Tally
                    </span>
                  </div>
                </div>
                <Badge variant="neutral">Roadmap</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Direct read-only ledger ingestion and bidirectional webhook permit verification for enterprise
                ERP accounting platforms without bespoke middleware.
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">
                      Hardware Security Module (HSM) Signing
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      FIPS 140-3 Level 4 Key Rings
                    </span>
                  </div>
                </div>
                <Badge variant="neutral">Roadmap</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Migrates Ed25519 permit generation into physical hardware security modules for high-throughput
                multi-datacenter clusters with tamper-resistant audit memory.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 6. CALL TO ACTION */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-950 m-0">
          Explore the Live Governed Runtime
        </h3>
        <p className="text-xs text-slate-600 max-w-lg mx-auto m-0">
          Test financial agent instructions, inspect policy evaluations, and verify cryptographic execution permits.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/agent"
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>Launch Financial Agent Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/docs"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <span>Documentation Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
