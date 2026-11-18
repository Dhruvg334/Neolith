"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  X,
  ArrowRight,
  CheckSquare,
  BookOpen,
  Lock,
  Wallet,
  FileCode,
  DollarSign,
  Users,
  FileText,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface ScenarioCheck {
  title: string;
  statusText: string;
  badgeStyle: "positive" | "warning" | "negative";
  description: string;
}

interface VisualScenario {
  id: string;
  invoiceId: string;
  scenarioType: string;
  vendor: string;
  amount: string;
  category: string;
  status: "allow" | "review" | "deny";
  statusBadge: string;
  statusHeadline: string;
  plainEnglishStory: string;
  checks: {
    budget: ScenarioCheck;
    threshold: ScenarioCheck;
    vendor: ScenarioCheck;
    outcome: ScenarioCheck;
  };
}

const VISUAL_SCENARIOS: VisualScenario[] = [
  {
    id: "sc-routine",
    invoiceId: "INV-001",
    scenarioType: "Routine Monthly Bill",
    vendor: "Acme Cloud Services",
    amount: "₹8,000.00",
    category: "Software Subscription",
    status: "allow",
    statusBadge: "Paid Automatically",
    statusHeadline: "Safe & Approved Instantly",
    plainEnglishStory:
      "This is a regular subscription to an approved software supplier and fits comfortably inside your monthly budget. Neolith pays it automatically without taking up any of your team's time.",
    checks: {
      budget: {
        title: "1. Monthly Department Budget",
        statusText: "Within Budget",
        badgeStyle: "positive",
        description: "₹8,000 used of ₹25,000 Software budget (₹17,000 remaining this month).",
      },
      threshold: {
        title: "2. Manager Sign-Off Rule",
        statusText: "Under Limit",
        badgeStyle: "positive",
        description: "Well under the ₹25,000 manager sign-off threshold. No paperwork needed.",
      },
      vendor: {
        title: "3. Supplier Safety",
        statusText: "Verified Supplier",
        badgeStyle: "positive",
        description: "Recognized, verified vendor saved in your company contact directory.",
      },
      outcome: {
        title: "4. Result for Your Bank Account",
        statusText: "Paid Safely",
        badgeStyle: "positive",
        description: "Invoice settled directly and receipt logged to your company accounts ledger.",
      },
    },
  },
  {
    id: "sc-high-value",
    invoiceId: "INV-002",
    scenarioType: "Large Equipment Purchase",
    vendor: "Nova Compute Systems",
    amount: "₹35,000.00",
    category: "Infrastructure",
    status: "review",
    statusBadge: "Needs Manager Approval",
    statusHeadline: "Held Safely for Your Review",
    plainEnglishStory:
      "The vendor is legitimate and budget is available, but any bill over ₹25,000 requires human eyes before money leaves your company. Neolith pauses it and waits for a manager's one-click approval.",
    checks: {
      budget: {
        title: "1. Monthly Department Budget",
        statusText: "Budget Available",
        badgeStyle: "positive",
        description: "₹35,000 fits within the department's ₹50,000 infrastructure quota.",
      },
      threshold: {
        title: "2. Manager Sign-Off Rule",
        statusText: "Approval Required",
        badgeStyle: "warning",
        description: "Over your ₹25,000 policy limit — requires human sign-off before payment.",
      },
      vendor: {
        title: "3. Supplier Safety",
        statusText: "Verified Supplier",
        badgeStyle: "positive",
        description: "Recognized corporate vendor with verified bank details on file.",
      },
      outcome: {
        title: "4. Result for Your Bank Account",
        statusText: "Funds Safe in Your Bank",
        badgeStyle: "warning",
        description: "Money stays safely in your bank account until you click Approve in the dashboard.",
      },
    },
  },
  {
    id: "sc-unverified",
    invoiceId: "INV-003",
    scenarioType: "Suspicious Unknown Bill",
    vendor: "Unknown Services Corp",
    amount: "₹60,000.00",
    category: "Miscellaneous",
    status: "deny",
    statusBadge: "Blocked Instantly",
    statusHeadline: "Hard-Blocked by Safety Rules",
    plainEnglishStory:
      "This vendor is not in your company's saved contacts directory, and the bill blows past the monthly miscellaneous limit. Neolith blocks the transaction instantly so zero company money is ever lost.",
    checks: {
      budget: {
        title: "1. Monthly Department Budget",
        statusText: "Over Budget",
        badgeStyle: "negative",
        description: "Exceeds the ₹10,000 monthly limit for miscellaneous spend by ₹50,000.",
      },
      threshold: {
        title: "2. Manager Sign-Off Rule",
        statusText: "Safety Violation",
        badgeStyle: "negative",
        description: "Failed spending cap rules for one-off charges without prior approval.",
      },
      vendor: {
        title: "3. Supplier Safety",
        statusText: "Unrecognized Sender",
        badgeStyle: "negative",
        description: "Unknown vendor not listed in your verified bank contacts directory.",
      },
      outcome: {
        title: "4. Result for Your Bank Account",
        statusText: "Zero Money Moved",
        badgeStyle: "negative",
        description: "Blocked completely. No money leaves your bank, and an alert is logged.",
      },
    },
  },
];

export function LandingPageClient() {
  const [selectedScenario, setSelectedScenario] = useState<VisualScenario>(VISUAL_SCENARIOS[0]!);

  return (
    <div className="space-y-20 py-4 max-w-6xl mx-auto">
      {/* 1. HERO SECTION (SPACIOUS, CENTERED & HUMAN-UNDERSTANDABLE) */}
      <section className="text-center space-y-6 pt-4 pb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-900">
          Let AI Agents Manage Corporate Finance.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-ember-600 via-ember-500 to-amber-500">
            Without Giving Them the Keys to the Bank.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
          AI agents are great at analyzing invoices, checking receipts, and preparing payments—but letting
          an LLM execute transactions directly is a catastrophic risk. Neolith acts as an authoritative
          firewall between your AI and your bank accounts, strictly enforcing company budgets, requiring human
          approval for large payments, and blocking unauthorized transfers.
        </p>

        {/* Primary Command Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link
            href="/agent"
            className="rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 shadow-glow bg-ember-500 hover:bg-ember-600 hover:scale-[1.02] flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Financial Agent</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/approvals"
            className="rounded-xl px-6 py-3.5 text-sm font-bold text-slate-800 transition-all duration-200 border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-sm flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4 text-amber-500" />
            <span>Human Approvals Queue</span>
          </Link>
          <Link
            href="/docs"
            className="rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Documentation Hub</span>
          </Link>
        </div>

        {/* Key Guarantees Trust Bar */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 border-t border-slate-200/80 mt-6">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Zero Direct Bank Keys
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Hard Spending Ceilings
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Mandatory Manager Sign-Off
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Tamper-Proof Audit Receipts
          </span>
        </div>
      </section>

      {/* 2. THE PROBLEM VS. THE NEOLITH SOLUTION */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            The Fundamental Dilemma of Financial AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Why giving an LLM direct API keys to your bank account always ends in disaster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Unprotected Agent */}
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <XCircle className="w-5 h-5 text-red-500" />
              <span>Unprotected AI Agent (Direct Access)</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 list-none p-0 m-0 leading-relaxed">
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Hallucinations &amp; Prompt Injection:</strong> Poisoned invoice text or unexpected prompt responses can trick an LLM into sending money to attacker accounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Runaway Spending Loops:</strong> In a recursive loop or duplicate run, the agent can drain treasury balances beyond intended budgets.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span><strong>No Human Verification:</strong> High-value wire transfers execute unilaterally without financial manager oversight.</span>
              </li>
            </ul>
          </div>

          {/* Card B: Neolith Governed System */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Neolith Governed Architecture</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 list-none p-0 m-0 leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Separation of Powers:</strong> The AI can freely research and propose payments, but holds zero execution authority or banking credentials.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hard Category Budgets:</strong> Spending caps are mathematically enforced. The agent physically cannot overspend even if it hallucinates.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Manager Approvals &amp; Audit Trail:</strong> High-value transactions pause for human sign-off, and every decision produces an immutable audit receipt.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 CLEAR VISUAL STEPS) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How Neolith Protects Your Treasury in 3 Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From invoice ingestion to permitted bank settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Plans & Proposes</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Your AI agent inspects incoming invoices, checks account balances, and drafts a structured payment proposal
              explaining its reasoning. The AI has zero banking keys or payment permissions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-ember-500 text-white flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Neolith Checks Corporate Rules</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              In milliseconds, Neolith verifies the vendor against approved lists, checks remaining category budget,
              and evaluates spending thresholds. If rules are breached, it blocks the action immediately.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Permitted Settlement or Sign-Off</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Routine payments under threshold receive a single-use 60-second execution permit for bank debit.
              Transactions exceeding your review threshold pause safely in the manager approval queue.
            </p>
          </div>
        </div>
      </section>

      {/* 4. REAL-WORLD BUSINESS EXAMPLES (CLEAN, INTUITIVE & NON-TECHNICAL) */}
      <section className="rounded-3xl border border-slate-800 bg-[#070B16] p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ember-400 block mb-1">
            Real-World Company Examples
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            See How Company Money Is Protected in Real Life
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Choose a common billing situation below to see how your spending rules protect company bank accounts from overspending, surprise charges, and unauthorized vendors.
          </p>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VISUAL_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const badgeColor =
              sc.status === "allow"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : sc.status === "review"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30";

            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenario(sc)}
                className={`text-left p-4 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-ember-500 bg-slate-900/90 shadow-glow"
                    : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-slate-300 text-xs">{sc.scenarioType}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                    {sc.statusBadge}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{sc.vendor}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sc.amount} • {sc.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scenario Outcome Box */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 sm:p-6 space-y-5">
          {/* Top Headline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                  selectedScenario.status === "allow"
                    ? "bg-emerald-500 text-white"
                    : selectedScenario.status === "review"
                      ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                }`}
              >
                {selectedScenario.status === "allow" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : selectedScenario.status === "review" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-white">
                    {selectedScenario.scenarioType}: {selectedScenario.vendor}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedScenario.status === "allow"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : selectedScenario.status === "review"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {selectedScenario.statusHeadline}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 m-0 leading-relaxed font-normal">
                  {selectedScenario.plainEnglishStory}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Plain-English Business Checkpoints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Check 1: Budget */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Wallet className="w-3.5 h-3.5 text-ember-400" />
                  {selectedScenario.checks.budget.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    selectedScenario.checks.budget.badgeStyle === "positive"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {selectedScenario.checks.budget.statusText}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed m-0">
                {selectedScenario.checks.budget.description}
              </p>
            </div>

            {/* Check 2: Manager Threshold */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  {selectedScenario.checks.threshold.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    selectedScenario.checks.threshold.badgeStyle === "positive"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : selectedScenario.checks.threshold.badgeStyle === "warning"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {selectedScenario.checks.threshold.statusText}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed m-0">
                {selectedScenario.checks.threshold.description}
              </p>
            </div>

            {/* Check 3: Vendor Safety */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedScenario.checks.vendor.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    selectedScenario.checks.vendor.badgeStyle === "positive"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {selectedScenario.checks.vendor.statusText}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed m-0">
                {selectedScenario.checks.vendor.description}
              </p>
            </div>

            {/* Check 4: Outcome for Company */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  {selectedScenario.checks.outcome.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    selectedScenario.checks.outcome.badgeStyle === "positive"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : selectedScenario.checks.outcome.badgeStyle === "warning"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {selectedScenario.checks.outcome.statusText}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed m-0">
                {selectedScenario.checks.outcome.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOUR ENTERPRISE SECURITY PILLARS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Engineered for Total Financial Safety
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Four non-negotiable guarantees that eliminate ambient risk when deploying autonomous financial agents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Direct Authority</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Agents propose actions through typed schemas. They never touch private keys or real bank credentials.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hard Spending Caps</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Departmental budgets are enforced automatically. If an agent tries to overspend, the system halts it.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Human Sign-Off Checkpoints</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Configure spending limits where human financial managers must review and confirm before settlement.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tamper-Proof Audit Chain</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Every decision produces a cryptographically signed receipt linked into an unalterable audit ledger.
            </p>
          </div>
        </div>
      </section>

      {/* 6. PLATFORM WORKSPACES SHOWCASE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Explore the Neolith Workspaces
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Intuitive consoles designed for operators, finance teams, and governance managers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/agent"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-ember-500 hover:shadow-glow transition-all duration-200 group"
          >
            <div className="text-slate-900 font-bold text-sm mb-1.5 group-hover:text-ember-600 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-ember-500" />
                Financial Agent
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-slate-400 group-hover:text-ember-500" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Interactive financial planning console with real-time balance context and policy controls.
            </p>
          </Link>

          <Link
            href="/approvals"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-500 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-slate-900 font-bold text-sm mb-1.5 group-hover:text-amber-600 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                Approvals Queue
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-slate-400 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Human review queue to inspect high-value proposals, verify invoices, and authorize settlement.
            </p>
          </Link>

          <Link
            href="/accounts"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-500 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-slate-900 font-bold text-sm mb-1.5 group-hover:text-teal-600 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600" />
                Accounts & Budgets
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-slate-400 group-hover:text-teal-500" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Live operating balances, category spend meters, unpaid invoices, and historical ledger entries.
            </p>
          </Link>

          <Link
            href="/policies"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-800 hover:shadow-md transition-all duration-200 group"
          >
            <div className="text-slate-900 font-bold text-sm mb-1.5 group-hover:text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-700" />
                Policy Studio
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-slate-400 group-hover:text-slate-800" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Test candidate actions against policy rules, preview budget deltas, and tune risk profiles.
            </p>
          </Link>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="rounded-3xl border border-slate-800 bg-[#070B16] p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ready to Run Autonomous Financial AI Safely?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Test candidate proposals in our interactive console or explore the enterprise architecture documentation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <Link
              href="/agent"
              className="rounded-xl px-6 py-3.5 text-xs font-bold text-white shadow-glow bg-ember-500 hover:bg-ember-600 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Financial Agent Console</span>
            </Link>
            <Link
              href="/adopt"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-teal-400" />
              <span>View Enterprise Adoption Guide</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
