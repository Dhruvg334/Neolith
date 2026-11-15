"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, Bot, Layers } from "lucide-react";
import { AgentTaskConsole } from "./AgentTaskConsole";
import { LandingPageClient } from "./LandingPageClient";

export type NavTabId =
  | "command"
  | "agents"
  | "policy"
  | "approvals"
  | "exec"
  | "budget"
  | "audit";

interface NavItemDef {
  readonly id: NavTabId;
  readonly label: string;
  readonly badge?: string;
  readonly subtitle: string;
}

const NAV_ITEMS: readonly NavItemDef[] = [
  { id: "command", label: "Command Center", subtitle: "Fleet-wide accountability at a glance" },
  { id: "agents", label: "Agents", subtitle: "Registered agents and their granted authority" },
  { id: "policy", label: "Policy Engine", subtitle: "Rules evaluated before every action" },
  { id: "approvals", label: "Approvals", badge: "4", subtitle: "Human decisions on gated actions" },
  { id: "exec", label: "Execution Explorer", subtitle: "Every action, decision and outcome" },
  { id: "budget", label: "Budgets", subtitle: "Spend limits and burn rate" },
  { id: "audit", label: "Audit & Security", subtitle: "Tamper-evident record of authority" },
];

interface AgentRecord {
  readonly id: string;
  readonly name: string;
  readonly status: "Active" | "Gated" | "Paused" | "Suspended";
  readonly team: string;
  readonly actions: string;
  readonly denial: string;
  readonly spend: string;
  readonly risk: "Low" | "Medium" | "High";
  readonly active: string;
  readonly owner: string;
  readonly budgetUsed: string;
  readonly budgetLimit: string;
  readonly policiesCount: number;
}

const AGENT_DATA: readonly AgentRecord[] = [
  {
    id: "ag-0c41",
    name: "infra-remediator",
    status: "Gated",
    team: "Platform",
    actions: "317",
    denial: "11.4%",
    spend: "₹7,200",
    risk: "High",
    active: "9m",
    owner: "Platform",
    budgetUsed: "₹7,200",
    budgetLimit: "₹15,000",
    policiesCount: 3,
  },
  {
    id: "ag-0a12",
    name: "procurement-bot",
    status: "Active",
    team: "Finance Ops",
    actions: "1,284",
    denial: "2.1%",
    spend: "₹30,900",
    risk: "Medium",
    active: "2m",
    owner: "Finance",
    budgetUsed: "₹30,900",
    budgetLimit: "₹50,000",
    policiesCount: 4,
  },
  {
    id: "ag-0b23",
    name: "support-triage",
    status: "Active",
    team: "Customer Ops",
    actions: "9,402",
    denial: "0.6%",
    spend: "₹21,600",
    risk: "Low",
    active: "just now",
    owner: "Customer Ops",
    budgetUsed: "₹21,600",
    budgetLimit: "₹40,000",
    policiesCount: 2,
  },
  {
    id: "ag-0d54",
    name: "report-writer",
    status: "Active",
    team: "Analytics",
    actions: "2,051",
    denial: "0.9%",
    spend: "₹13,050",
    risk: "Low",
    active: "6m",
    owner: "Analytics",
    budgetUsed: "₹13,050",
    budgetLimit: "₹25,000",
    policiesCount: 2,
  },
  {
    id: "ag-0e65",
    name: "contract-reviewer",
    status: "Paused",
    team: "Legal",
    actions: "488",
    denial: "3.3%",
    spend: "₹9,750",
    risk: "Medium",
    active: "2h",
    owner: "Legal",
    budgetUsed: "₹9,750",
    budgetLimit: "₹20,000",
    policiesCount: 3,
  },
  {
    id: "ag-0f76",
    name: "data-exporter",
    status: "Suspended",
    team: "Data Eng",
    actions: "73",
    denial: "31.5%",
    spend: "₹900",
    risk: "High",
    active: "1d",
    owner: "Data Eng",
    budgetUsed: "₹900",
    budgetLimit: "₹10,000",
    policiesCount: 5,
  },
];

interface ExecutionRecord {
  readonly time: string;
  readonly agent: string;
  readonly action: string;
  readonly risk: "Low" | "Medium" | "High";
  readonly decision: "Allowed" | "Denied" | "Pending" | "Approved";
  readonly latency: string;
}

const EXECUTION_DATA: readonly ExecutionRecord[] = [
  { time: "14:32:08", agent: "procurement-bot", action: "vendor.create_po", risk: "Medium", decision: "Pending", latency: "—" },
  { time: "14:31:55", agent: "support-triage", action: "crm.update_ticket", risk: "Low", decision: "Allowed", latency: "412ms" },
  { time: "14:31:20", agent: "infra-remediator", action: "k8s.scale_deployment", risk: "High", decision: "Pending", latency: "—" },
  { time: "14:30:47", agent: "data-exporter", action: "s3.export_bucket", risk: "High", decision: "Denied", latency: "8ms" },
  { time: "14:29:12", agent: "report-writer", action: "sheets.read_range", risk: "Low", decision: "Allowed", latency: "230ms" },
  { time: "14:28:41", agent: "contract-reviewer", action: "docs.share_external", risk: "Medium", decision: "Approved", latency: "1.2s" },
];

interface ApprovalItem {
  readonly id: string;
  readonly time: string;
  readonly agent: string;
  readonly action: string;
  readonly risk: "Low" | "Medium" | "High";
  readonly waiting: string;
  readonly target: string;
  readonly policy: string;
  readonly params: string;
}

const INITIAL_APPROVALS: readonly ApprovalItem[] = [
  {
    id: "appr-01",
    time: "14:21",
    agent: "infra-remediator",
    action: "k8s.scale_deployment",
    risk: "High",
    waiting: "11m",
    target: "prod/payments-api",
    policy: "Require approval: infra writes",
    params: '{\n  "replicas": 3 → 12,\n  "cost_est": "₹28,500"\n}',
  },
  {
    id: "appr-02",
    time: "14:32",
    agent: "procurement-bot",
    action: "vendor.create_po",
    risk: "Medium",
    waiting: "2m",
    target: "Acme Cloud / INV-001",
    policy: "Require approval: invoices > ₹25,000",
    params: '{\n  "invoice_id": "INV-001",\n  "amount": "₹8,000.00",\n  "vendor": "Acme Cloud Services"\n}',
  },
  {
    id: "appr-03",
    time: "14:28",
    agent: "contract-reviewer",
    action: "docs.share_external",
    risk: "Medium",
    waiting: "4m",
    target: "contracts/msa-quantum.pdf",
    policy: "PII redaction on output",
    params: '{\n  "document": "msa-quantum.pdf",\n  "recipient": "external-counsel@legal.corp"\n}',
  },
  {
    id: "appr-04",
    time: "14:30",
    agent: "infra-remediator",
    action: "db.bulk_update",
    risk: "High",
    waiting: "1m",
    target: "prod/primary-db",
    policy: "Require approval: infra writes",
    params: '{\n  "table": "users",\n  "batch_size": 5000\n}',
  },
];

const DEFAULT_NAV: NavItemDef = {
  id: "command",
  label: "Command Center",
  subtitle: "Fleet-wide accountability at a glance",
};

const DEFAULT_AGENT: AgentRecord = {
  id: "ag-0c41",
  name: "infra-remediator",
  status: "Gated",
  team: "Platform",
  actions: "317",
  denial: "11.4%",
  spend: "₹7,200",
  risk: "High",
  active: "9m",
  owner: "Platform",
  budgetUsed: "₹7,200",
  budgetLimit: "₹15,000",
  policiesCount: 3,
};

const DEFAULT_APPROVAL: ApprovalItem = {
  id: "appr-01",
  time: "14:21",
  agent: "infra-remediator",
  action: "k8s.scale_deployment",
  risk: "High",
  waiting: "11m",
  target: "prod/payments-api",
  policy: "Require approval: infra writes",
  params: '{\n  "replicas": 3 → 12,\n  "cost_est": "₹28,500"\n}',
};

export function ReferenceConsoleView() {
  const [viewMode, setViewMode] = useState<"reference" | "landing">("reference");
  const [activeTab, setActiveTab] = useState<NavTabId>("command");
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>("appr-01");
  const [approvalsList, setApprovalsList] = useState<readonly ApprovalItem[]>(INITIAL_APPROVALS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [policyVersion] = useState("v7");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as NavTabId;
      if (NAV_ITEMS.some((n) => n.id === hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleNavClick = (id: NavTabId) => {
    setActiveTab(id);
    if (typeof window !== "undefined") {
      window.location.hash = `#${id}`;
    }
  };

  const handleApprove = (id: string) => {
    setApprovalsList((prev) => prev.filter((a) => a.id !== id));
    setActionNotice(`Action approved: single-use execution permit minted.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleDeny = (id: string) => {
    setApprovalsList((prev) => prev.filter((a) => a.id !== id));
    setActionNotice(`Action denied: blocked at Runtime Gateway.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const currentNav: NavItemDef = NAV_ITEMS.find((n) => n.id === activeTab) ?? DEFAULT_NAV;
  const selectedAgent: AgentRecord = AGENT_DATA[selectedAgentIndex] ?? DEFAULT_AGENT;
  const selectedApproval: ApprovalItem =
    approvalsList.find((a) => a.id === selectedApprovalId) ?? (approvalsList[0] ?? DEFAULT_APPROVAL);

  if (viewMode === "landing") {
    return (
      <div className="min-h-screen bg-[#070B16] text-white">
        <div className="sticky top-0 z-50 bg-[#070B16]/95 backdrop-blur-md border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMode("reference")}
            className="px-3 py-1.5 rounded-xl bg-[#7dd3c0] text-[#04201a] font-bold text-xs hover:bg-[#5eead4] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>&larr; Return to Fleet Command Center</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">Public Architecture Overview Mode</span>
        </div>
        <LandingPageClient />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-[#ededf0] font-sans text-[13px] antialiased overflow-hidden selection:bg-[#7dd3c0] selection:text-[#04201a]">
      {/* 1. COMPACT LEFT SIDEBAR (220px) */}
      <aside className="w-[220px] flex-none border-r border-[#222228] bg-[#0e0e11] flex flex-col p-[14px_10px] select-none">
        {/* Brand Logo */}
        <div className="flex items-center gap-[9px] px-2 pt-1 pb-4 font-semibold text-[15px] tracking-tight">
          <i className="w-5 h-5 rounded-[5px] border-[1.5px] border-[#7dd3c0] relative flex items-center justify-center not-italic">
            <span className="w-2 h-2 rounded-[1.5px] bg-[#7dd3c0]" />
          </i>
          <span className="font-bold text-white tracking-tight">Neolith</span>
        </div>

        {/* Organization / Environment */}
        <div className="mb-3.5 p-[7px_9px] rounded-lg border border-[#222228] text-[#a1a1aa] flex justify-between items-center text-xs">
          <span className="font-medium text-slate-200">Neolith Corp</span>
          <span className="text-[#6b6b76] font-mono text-[11px]">prod</span>
        </div>

        {/* Navigation Section */}
        <div className="text-[10.5px] uppercase tracking-wider text-[#6b6b76] px-[9px] pt-2 pb-1.5 font-bold">
          Platform Fleet
        </div>
        <nav className="space-y-[1px]" aria-label="Reference Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const badgeVal = item.id === "approvals" ? approvalsList.length.toString() : item.badge;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`flex items-center gap-[9px] px-[9px] py-[7px] rounded-md transition-all text-xs ${
                  isActive
                    ? "bg-[#1b1b21] text-[#ededf0] font-semibold"
                    : "text-[#a1a1aa] hover:bg-[#141418] hover:text-[#ededf0]"
                }`}
              >
                <b
                  className={`w-[5px] h-[5px] rounded-full transition-colors ${
                    isActive ? "bg-[#7dd3c0]" : "bg-[#6b6b76]"
                  }`}
                />
                <span>{item.label}</span>
                {badgeVal && parseInt(badgeVal) > 0 && (
                  <small className="ml-auto bg-[#f5b942] text-black rounded-full px-1.5 py-0 text-[10px] font-bold">
                    {badgeVal}
                  </small>
                )}
              </a>
            );
          })}
        </nav>

        {/* External Core Links */}
        <div className="text-[10.5px] uppercase tracking-wider text-[#6b6b76] px-[9px] pt-4 pb-1.5 font-bold">
          Workspaces
        </div>
        <div className="space-y-[1px]">
          <Link
            href="/agent"
            className="flex items-center gap-2 px-[9px] py-[6px] rounded-md text-[#a1a1aa] hover:bg-[#141418] hover:text-[#ededf0] text-xs transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-[#7dd3c0]" />
            <span>Interactive Agent</span>
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-[9px] py-[6px] rounded-md text-[#a1a1aa] hover:bg-[#141418] hover:text-[#ededf0] text-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#6b6b76]" />
            <span>Documentation Hub</span>
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto text-[#6b6b76] text-[11px] p-2 border-t border-[#222228] pt-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span>Governance Active</span>
          </div>
          <span className="text-[10px] text-[#6b6b76]">v0.2.0 · OPA v1.22.2 Rego</span>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[rgba(9,9,11,0.88)] backdrop-blur-md border-b border-[#222228] px-6 py-3 flex items-center gap-3">
          <div>
            <h1 className="text-[15px] font-semibold text-[#ededf0] tracking-tight m-0 inline-block mr-2">
              {currentNav.label}
            </h1>
            <span className="text-[#6b6b76] text-xs font-normal">
              {currentNav.subtitle}
            </span>
          </div>

          <div className="flex-1" />

          {/* Action Notification Toast */}
          {actionNotice && (
            <div className="px-3 py-1 rounded bg-[#141418] border border-[#7dd3c0] text-[#7dd3c0] text-xs animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Top Control Chips */}
          <span className="border border-[#2e2e36] bg-[#141418] text-[#a1a1aa] rounded-md px-2.5 py-1 text-xs cursor-pointer hover:border-[#6b6b76] hover:text-[#ededf0] transition-colors">
            Last 24 hours ▾
          </span>
          <span className="border border-[#2e2e36] bg-[#141418] text-[#4ade80] rounded-md px-2.5 py-1 text-xs inline-flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            Enforcement on
          </span>

          <button
            type="button"
            onClick={() => setViewMode("landing")}
            className="border border-[#2e2e36] bg-[#141418] text-[#a1a1aa] rounded-md px-2.5 py-1 text-xs hover:border-[#6b6b76] hover:text-[#ededf0] transition-colors"
            title="Switch to public architecture landing overview"
          >
            Public Architecture View
          </button>

          <button
            type="button"
            onClick={() => setShowConsoleModal(true)}
            className="border border-[#7dd3c0] bg-[#7dd3c0] text-[#04201a] font-semibold rounded-md px-3 py-1 text-xs hover:bg-[#5eead4] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Open Agent Console</span>
          </button>
        </header>

        {/* Main Page Content Grid */}
        <div className="p-6 pb-12 grid gap-4">
          {/* TAB 1: COMMAND CENTER */}
          {activeTab === "command" && (
            <>
              {/* 5-Column KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px] shadow-sm">
                  <p className="text-[#6b6b76] text-xs m-0 font-medium">Active agents</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1 tracking-tight">5</h2>
                  <em className="text-[#6b6b76] text-[11.5px] not-italic">of 6 registered</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px] shadow-sm">
                  <p className="text-[#6b6b76] text-xs m-0 font-medium">Actions (24h)</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1 tracking-tight">14,892</h2>
                  <em className="text-[#4ade80] text-[11.5px] not-italic">+8.2% vs prior</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px] shadow-sm">
                  <p className="text-[#6b6b76] text-xs m-0 font-medium">Pending approvals</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1 tracking-tight">{approvalsList.length}</h2>
                  <em className="text-[#f5b942] text-[11.5px] not-italic">oldest 11m</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px] shadow-sm">
                  <p className="text-[#6b6b76] text-xs m-0 font-medium">Policy denials</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1 tracking-tight">186</h2>
                  <em className="text-[#f87171] text-[11.5px] not-italic">1.2% of actions</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px] shadow-sm">
                  <p className="text-[#6b6b76] text-xs m-0 font-medium">Spend (MTD)</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1 tracking-tight">₹83,400</h2>
                  <em className="text-[#6b6b76] text-[11.5px] not-italic">74% of ₹1,12,500</em>
                </div>
              </div>

              {/* 2-Column Grid: Stacked Chart & Risk Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 24-Hour Decision Stack Chart */}
                <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-[#222228] mb-3">
                    <span className="font-medium text-xs text-[#ededf0]">Actions by decision</span>
                    <div className="flex items-center gap-3.5 text-[#6b6b76] text-[11.5px]">
                      <span className="flex items-center gap-1.5">
                        <i className="w-2 h-2 rounded-[2px] bg-[#7dd3c0] inline-block" />
                        Allowed
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i className="w-2 h-2 rounded-[2px] bg-[#f87171] inline-block" />
                        Denied
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i className="w-2 h-2 rounded-[2px] bg-[#f5b942] inline-block" />
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* SVG Stacked Bar Chart */}
                  <div className="w-full">
                    <svg viewBox="0 0 600 170" width="100%" className="block">
                      {[0, 1, 2, 3].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          x2="600"
                          y1={i * 50 + 5}
                          y2={i * 50 + 5}
                          stroke="#222228"
                          strokeWidth="1"
                        />
                      ))}
                      {[...Array(24)].map((_, i) => {
                        const a = 40 + Math.round(30 * Math.sin(i / 3.4) + ((i * 37) % 17));
                        const e = 2 + ((i * 5) % 6);
                        const p = (i * 3) % 4;
                        const total = 90;
                        const ha = (a / total) * 135;
                        const he = (e / total) * 135;
                        const hp = (p / total) * 135;
                        const ya = 155 - ha;
                        const ye = ya - he;
                        const yp = ye - hp;
                        return (
                          <g key={i}>
                            <rect x={i * 25 + 3} y={ya} width="18" height={ha} fill="#7dd3c0" rx="1.5" opacity="0.9" />
                            <rect x={i * 25 + 3} y={ye} width="18" height={he} fill="#f87171" rx="1.5" opacity="0.9" />
                            <rect x={i * 25 + 3} y={yp} width="18" height={hp} fill="#f5b942" rx="1.5" opacity="0.9" />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-[#6b6b76] text-[11px] mt-1 font-mono">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>now</span>
                    </div>
                  </div>
                </div>

                {/* Risk Distribution Meters */}
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4 flex flex-col justify-between">
                  <div className="pb-3 border-b border-[#222228] mb-3 font-medium text-xs text-[#ededf0]">
                    Risk distribution
                  </div>
                  <div className="space-y-4 my-auto">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#a1a1aa]">Low (R0–R1)</span>
                        <span className="font-mono text-[#ededf0]">11,840</span>
                      </div>
                      <div className="h-1.5 bg-[#1b1b21] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4ade80] rounded-full" style={{ width: "80%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#a1a1aa]">Medium (R2–R3)</span>
                        <span className="font-mono text-[#ededf0]">2,610</span>
                      </div>
                      <div className="h-1.5 bg-[#1b1b21] rounded-full overflow-hidden">
                        <div className="h-full bg-[#f5b942] rounded-full" style={{ width: "18%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#a1a1aa]">High (R4)</span>
                        <span className="font-mono text-[#ededf0]">442</span>
                      </div>
                      <div className="h-1.5 bg-[#1b1b21] rounded-full overflow-hidden">
                        <div className="h-full bg-[#f87171] rounded-full" style={{ width: "3.5%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Grid: Recent Executions & Awaiting Approval */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Executions Table */}
                <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] overflow-hidden">
                  <div className="p-[12px_16px] border-b border-[#222228] font-medium text-xs text-[#ededf0]">
                    Recent executions
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#222228] text-[#6b6b76] text-[11.5px]">
                          <th className="p-[8px_16px] font-medium">Time</th>
                          <th className="p-[8px_16px] font-medium">Agent</th>
                          <th className="p-[8px_16px] font-medium">Action</th>
                          <th className="p-[8px_16px] font-medium">Risk</th>
                          <th className="p-[8px_16px] font-medium">Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EXECUTION_DATA.map((row) => (
                          <tr
                            key={row.time + row.action}
                            className="border-b border-[#222228] hover:bg-[#141418] cursor-pointer transition-colors"
                          >
                            <td className="p-[9px_16px] text-[#6b6b76] font-mono">{row.time}</td>
                            <td className="p-[9px_16px] font-medium text-slate-200">{row.agent}</td>
                            <td className="p-[9px_16px] font-mono text-[#a1a1aa]">{row.action}</td>
                            <td className="p-[9px_16px]">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs ${
                                  row.risk === "Low"
                                    ? "text-[#4ade80]"
                                    : row.risk === "Medium"
                                      ? "text-[#f5b942]"
                                      : "text-[#f87171]"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {row.risk}
                              </span>
                            </td>
                            <td className="p-[9px_16px]">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                  row.decision === "Allowed"
                                    ? "text-[#7dd3c0]"
                                    : row.decision === "Denied"
                                      ? "text-[#f87171]"
                                      : row.decision === "Approved"
                                        ? "text-[#7aa2f7]"
                                        : "text-[#f5b942]"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {row.decision}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Awaiting Approval Card */}
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4 flex flex-col justify-between">
                  <div>
                    <div className="pb-3 border-b border-[#222228] mb-3 font-medium text-xs text-[#ededf0]">
                      Awaiting approval ({approvalsList.length})
                    </div>
                    <div className="space-y-2">
                      {approvalsList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 border-b border-[#222228] text-xs"
                        >
                          <span className="font-mono text-[#ededf0]">{item.action}</span>
                          <span className="inline-flex items-center gap-1 text-[#f5b942] font-mono text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {item.waiting}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#222228]">
                    <button
                      type="button"
                      onClick={() => handleNavClick("approvals")}
                      className="w-full py-1.5 rounded-md bg-[#7dd3c0] text-[#04201a] font-semibold text-xs hover:bg-[#5eead4] transition-colors"
                    >
                      Open Review Queue &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: AGENTS FLEET */}
          {activeTab === "agents" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Agent Fleet Table */}
              <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] overflow-hidden">
                <div className="p-3 border-b border-[#222228] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#ededf0]">All agents</span>
                    <span className="text-xs text-[#6b6b76]">· {AGENT_DATA.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="border border-[#2e2e36] bg-[#141418] text-[#a1a1aa] rounded px-2 py-0.5 text-xs">
                      Status: any ▾
                    </span>
                    <span className="border border-[#2e2e36] bg-[#141418] text-[#a1a1aa] rounded px-2 py-0.5 text-xs">
                      Team ▾
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#222228] text-[#6b6b76] text-[11.5px]">
                        <th className="p-[8px_16px] font-medium">Agent</th>
                        <th className="p-[8px_16px] font-medium">Status</th>
                        <th className="p-[8px_16px] font-medium">Team</th>
                        <th className="p-[8px_16px] font-medium">Actions</th>
                        <th className="p-[8px_16px] font-medium">Denial</th>
                        <th className="p-[8px_16px] font-medium">Spend</th>
                        <th className="p-[8px_16px] font-medium">Risk</th>
                        <th className="p-[8px_16px] font-medium">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENT_DATA.map((ag, i) => (
                        <tr
                          key={ag.name}
                          onClick={() => setSelectedAgentIndex(i)}
                          className={`border-b border-[#222228] cursor-pointer transition-colors ${
                            selectedAgentIndex === i ? "bg-[#141418]" : "hover:bg-[#141418]"
                          }`}
                        >
                          <td className="p-[9px_16px] font-medium text-[#ededf0]">{ag.name}</td>
                          <td className="p-[9px_16px]">
                            <span
                              className={`inline-flex items-center gap-1.5 ${
                                ag.status === "Active"
                                  ? "text-[#4ade80]"
                                  : ag.status === "Gated"
                                    ? "text-[#f5b942]"
                                    : ag.status === "Suspended"
                                      ? "text-[#f87171]"
                                      : "text-[#6b6b76]"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {ag.status}
                            </span>
                          </td>
                          <td className="p-[9px_16px] text-[#a1a1aa]">{ag.team}</td>
                          <td className="p-[9px_16px] font-mono text-[#ededf0]">{ag.actions}</td>
                          <td className="p-[9px_16px] font-mono text-[#f87171]">{ag.denial}</td>
                          <td className="p-[9px_16px] font-mono text-[#a1a1aa]">{ag.spend}</td>
                          <td className="p-[9px_16px]">
                            <span
                              className={`text-xs ${
                                ag.risk === "Low"
                                  ? "text-[#4ade80]"
                                  : ag.risk === "Medium"
                                    ? "text-[#f5b942]"
                                    : "text-[#f87171]"
                              }`}
                            >
                              {ag.risk}
                            </span>
                          </td>
                          <td className="p-[9px_16px] text-[#6b6b76] font-mono">{ag.active}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent Detail Inspector Card */}
              <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#222228] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#ededf0]">{selectedAgent.name}</span>
                    <span className="border border-[#2e2e36] text-[#a1a1aa] rounded px-1.5 py-0.5 text-[10px] font-mono">
                      {selectedAgent.id}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      selectedAgent.status === "Active"
                        ? "text-[#4ade80]"
                        : selectedAgent.status === "Gated"
                          ? "text-[#f5b942]"
                          : "text-[#f87171]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {selectedAgent.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Owner Team</span>
                    <span className="text-[#ededf0] font-medium">{selectedAgent.owner}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Risk Tier</span>
                    <span className="text-[#f5b942] font-semibold">{selectedAgent.risk}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Denial Rate</span>
                    <span className="text-[#f87171] font-mono">{selectedAgent.denial}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Budget Allocated</span>
                    <span className="font-mono text-[#ededf0]">
                      {selectedAgent.budgetUsed} / {selectedAgent.budgetLimit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Policies Attached</span>
                    <span className="text-[#ededf0] font-mono">{selectedAgent.policiesCount} enforced</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222228] flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsoleModal(true)}
                    className="flex-1 py-1.5 rounded-md bg-[#7dd3c0] text-[#04201a] font-semibold text-xs hover:bg-[#5eead4] transition-colors"
                  >
                    Launch Agent Console
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md border border-[#2e2e36] text-[#f87171] hover:bg-[#1b1b21] text-xs font-medium transition-colors"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POLICY ENGINE */}
          {activeTab === "policy" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Policies List */}
              <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                <div className="pb-3 border-b border-[#222228] mb-3 font-medium text-xs text-[#ededf0]">
                  Active OPA Rego Policies
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                    <span className="font-semibold text-white">Require approval: infra writes</span>
                    <span className="text-[#7dd3c0] font-medium text-xs">Enforced</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                    <span className="text-[#ededf0]">Deny external data export</span>
                    <span className="text-[#7dd3c0] font-medium text-xs">Enforced</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                    <span className="text-[#ededf0]">Block off-hours deploys</span>
                    <span className="text-[#f5b942] font-medium text-xs">Monitor</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                    <span className="text-[#ededf0]">PII redaction on output</span>
                    <span className="text-[#7dd3c0] font-medium text-xs">Enforced</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[#ededf0]">Cap single action cost ₹25,000</span>
                    <span className="text-[#6b6b76] font-medium text-xs">Draft</span>
                  </div>
                </div>
              </div>

              {/* Rego Code Preview */}
              <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222228] mb-3">
                  <span className="font-medium text-xs text-[#ededf0]">
                    Require approval: infra writes
                  </span>
                  <span className="border border-[#2e2e36] text-[#a1a1aa] rounded px-1.5 py-0.5 text-[10px] font-mono">
                    {policyVersion}
                  </span>
                </div>
                <pre className="bg-[#09090b] border border-[#222228] rounded-lg p-3 text-xs font-mono text-[#a1a1aa] leading-relaxed overflow-x-auto m-0">
                  <span className="text-[#7aa2f7]">when</span> action.category =={" "}
                  <span className="text-[#7dd3c0]">&quot;infra.write&quot;</span>
                  {"\n"}  <span className="text-[#7aa2f7]">and</span> agent.risk_tier &gt;={" "}
                  <span className="text-[#7dd3c0]">&quot;high&quot;</span>
                  {"\n"}<span className="text-[#7aa2f7]">then</span>{" "}
                  <span className="text-[#f87171]">require_approval</span>(
                  {"\n"}  approvers:{" "}
                  <span className="text-[#7dd3c0]">&quot;platform-oncall&quot;</span>,
                  {"\n"}  timeout: <span className="text-[#7dd3c0]">&quot;30m&quot;</span>)
                  {"\n"}<span className="text-[#7aa2f7]">else</span> allow
                </pre>
                <div className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Evaluations (24h)</span>
                    <span className="font-mono text-[#ededf0]">317</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222228]">
                    <span className="text-[#6b6b76]">Triggered</span>
                    <span className="font-mono text-[#f5b942]">94</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6b6b76]">Applies to</span>
                    <span className="font-mono text-[#ededf0]">2 agents</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPROVALS REVIEW QUEUE */}
          {activeTab === "approvals" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Pending Approvals Table */}
              <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] overflow-hidden">
                <div className="p-3 border-b border-[#222228] flex items-center justify-between">
                  <span className="font-medium text-xs text-[#ededf0]">
                    Pending Human Sign-Offs · {approvalsList.length}
                  </span>
                  <span className="text-xs text-[#6b6b76]">Dual-key gate</span>
                </div>
                {approvalsList.length === 0 ? (
                  <div className="p-8 text-center text-[#6b6b76] text-xs">
                    All queued actions reviewed. Zero actions pending execution permits.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#222228] text-[#6b6b76] text-[11.5px]">
                          <th className="p-[8px_16px] font-medium">Requested</th>
                          <th className="p-[8px_16px] font-medium">Agent</th>
                          <th className="p-[8px_16px] font-medium">Action</th>
                          <th className="p-[8px_16px] font-medium">Risk</th>
                          <th className="p-[8px_16px] font-medium">Waiting</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvalsList.map((appr) => (
                          <tr
                            key={appr.id}
                            onClick={() => setSelectedApprovalId(appr.id)}
                            className={`border-b border-[#222228] cursor-pointer transition-colors ${
                              selectedApprovalId === appr.id ? "bg-[#141418]" : "hover:bg-[#141418]"
                            }`}
                          >
                            <td className="p-[9px_16px] font-mono text-[#6b6b76]">{appr.time}</td>
                            <td className="p-[9px_16px] font-medium text-slate-200">{appr.agent}</td>
                            <td className="p-[9px_16px] font-mono text-[#a1a1aa]">{appr.action}</td>
                            <td className="p-[9px_16px]">
                              <span
                                className={`text-xs ${
                                  appr.risk === "Low"
                                    ? "text-[#4ade80]"
                                    : appr.risk === "Medium"
                                      ? "text-[#f5b942]"
                                      : "text-[#f87171]"
                                }`}
                              >
                                {appr.risk}
                              </span>
                            </td>
                            <td className="p-[9px_16px] font-mono text-[#f5b942]">{appr.waiting}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Approval Diff Inspector */}
              {selectedApproval && (
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4 flex flex-col justify-between">
                  <div>
                    <div className="pb-3 border-b border-[#222228] mb-3 font-semibold text-xs text-[#ededf0]">
                      {selectedApproval.action}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#222228]">
                        <span className="text-[#6b6b76]">Agent</span>
                        <span className="font-medium text-[#ededf0]">{selectedApproval.agent}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222228]">
                        <span className="text-[#6b6b76]">Target</span>
                        <span className="font-mono text-[#a1a1aa]">{selectedApproval.target}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222228]">
                        <span className="text-[#6b6b76]">Gating Policy</span>
                        <span className="text-[#ededf0]">{selectedApproval.policy}</span>
                      </div>
                    </div>

                    <p className="text-[#6b6b76] text-xs mt-3 mb-1.5 font-medium">
                      Requested parameters diff:
                    </p>
                    <pre className="bg-[#09090b] border border-[#222228] rounded-lg p-2.5 text-xs font-mono text-[#a1a1aa] m-0">
                      {selectedApproval.params}
                    </pre>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#222228] flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApproval.id)}
                      className="flex-1 py-1.5 rounded-md bg-[#7dd3c0] text-[#04201a] font-semibold text-xs hover:bg-[#5eead4] transition-colors"
                    >
                      Approve &amp; Mint Permit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeny(selectedApproval.id)}
                      className="px-3 py-1.5 rounded-md border border-[#2e2e36] text-[#f87171] hover:bg-[#1b1b21] text-xs font-medium transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EXECUTION EXPLORER */}
          {activeTab === "exec" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Execution Table */}
              <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] overflow-hidden">
                <div className="p-3 border-b border-[#222228] flex items-center justify-between">
                  <span className="font-medium text-xs text-[#ededf0]">Recent Executions Trace</span>
                  <span className="text-[#6b6b76] text-xs">Deterministic Ledger</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#222228] text-[#6b6b76] text-[11.5px]">
                        <th className="p-[8px_16px] font-medium">Time</th>
                        <th className="p-[8px_16px] font-medium">Agent</th>
                        <th className="p-[8px_16px] font-medium">Action</th>
                        <th className="p-[8px_16px] font-medium">Risk</th>
                        <th className="p-[8px_16px] font-medium">Decision</th>
                        <th className="p-[8px_16px] font-medium">Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EXECUTION_DATA.map((row) => (
                        <tr
                          key={row.time + row.action}
                          className="border-b border-[#222228] hover:bg-[#141418] cursor-pointer transition-colors"
                        >
                          <td className="p-[9px_16px] font-mono text-[#6b6b76]">{row.time}</td>
                          <td className="p-[9px_16px] font-medium text-slate-200">{row.agent}</td>
                          <td className="p-[9px_16px] font-mono text-[#a1a1aa]">{row.action}</td>
                          <td className="p-[9px_16px]">
                            <span
                              className={`text-xs ${
                                row.risk === "Low"
                                  ? "text-[#4ade80]"
                                  : row.risk === "Medium"
                                    ? "text-[#f5b942]"
                                    : "text-[#f87171]"
                              }`}
                            >
                              {row.risk}
                            </span>
                          </td>
                          <td className="p-[9px_16px]">
                            <span
                              className={`inline-flex items-center gap-1.5 ${
                                row.decision === "Allowed"
                                  ? "text-[#7dd3c0]"
                                  : row.decision === "Denied"
                                    ? "text-[#f87171]"
                                    : row.decision === "Approved"
                                      ? "text-[#7aa2f7]"
                                      : "text-[#f5b942]"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {row.decision}
                            </span>
                          </td>
                          <td className="p-[9px_16px] font-mono text-[#6b6b76]">{row.latency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trace Timeline Detail */}
              <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222228] mb-3">
                  <span className="font-semibold text-xs text-[#ededf0]">
                    Trace · vendor.create_po
                  </span>
                  <span className="border border-[#2e2e36] text-[#a1a1aa] rounded px-1.5 py-0.5 text-[10px] font-mono">
                    ex-9f2a1
                  </span>
                </div>
                <div className="relative pl-5 space-y-4">
                  <div className="relative">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-[#7dd3c0]" />
                    <div className="font-medium text-xs text-[#ededf0]">Intent received</div>
                    <span className="text-[#6b6b76] font-mono text-[11px]">14:32:08.014</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-[#7dd3c0]" />
                    <div className="font-medium text-xs text-[#ededf0]">Policy evaluated</div>
                    <span className="text-[#6b6b76] text-[11px]">
                      2 matched · 1 requires approval
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-[#7dd3c0]" />
                    <div className="font-medium text-xs text-[#ededf0]">Held for approval</div>
                    <span className="text-[#6b6b76] text-[11px]">
                      Finance approvers notified
                    </span>
                  </div>
                  <div className="relative opacity-45">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-[#6b6b76]" />
                    <div className="font-medium text-xs text-[#ededf0]">Execution</div>
                    <span className="text-[#6b6b76] text-[11px]">Not started</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BUDGETS & QUOTAS */}
          {activeTab === "budget" && (
            <>
              {/* 5-Column Budgets KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px]">
                  <p className="text-[#6b6b76] text-xs m-0">Spend MTD</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1">₹83,400</h2>
                  <em className="text-[#f5b942] text-[11.5px] not-italic">74% of limit</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px]">
                  <p className="text-[#6b6b76] text-xs m-0">Projected</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1">₹1,07,250</h2>
                  <em className="text-[#4ade80] text-[11.5px] not-italic">within limit</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px]">
                  <p className="text-[#6b6b76] text-xs m-0">Agents near cap</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1">1</h2>
                  <em className="text-[#f5b942] text-[11.5px] not-italic">data-exporter</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px]">
                  <p className="text-[#6b6b76] text-xs m-0">Avg / action</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1">₹5.60</h2>
                  <em className="text-[#4ade80] text-[11.5px] not-italic">-4% vs prior</em>
                </div>
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-[14px_16px]">
                  <p className="text-[#6b6b76] text-xs m-0">Blocked by budget</p>
                  <h2 className="text-[26px] font-medium text-[#ededf0] my-1">12</h2>
                  <em className="text-[#6b6b76] text-[11.5px] not-italic">this month</em>
                </div>
              </div>

              {/* 2-Column: Cumulative Curve & Agent Spend Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* SVG Cumulative Spend Chart */}
                <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#222228] mb-3">
                    <span className="font-medium text-xs text-[#ededf0]">Cumulative spend</span>
                    <span className="text-[#6b6b76] text-xs">Month to date</span>
                  </div>
                  <svg viewBox="0 0 600 170" width="100%" className="block">
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        x2="600"
                        y1={i * 50 + 5}
                        y2={i * 50 + 5}
                        stroke="#222228"
                        strokeWidth="1"
                      />
                    ))}
                    <polygon
                      points="0,155 0,150 40,145 80,138 120,130 160,122 200,115 240,105 280,95 320,84 360,74 400,65 440,58 480,50 520,44 560,38 580,35 580,155"
                      fill="#7dd3c0"
                      opacity="0.08"
                    />
                    <polyline
                      points="0,150 40,145 80,138 120,130 160,122 200,115 240,105 280,95 320,84 360,74 400,65 440,58 480,50 520,44 560,38 580,35"
                      fill="none"
                      stroke="#7dd3c0"
                      strokeWidth="1.8"
                    />
                    <line x1="0" x2="600" y1="28" y2="28" stroke="#f5b942" strokeDasharray="4 4" />
                    <text x="596" y="22" fill="#f5b942" fontSize="10" textAnchor="end">
                      Monthly limit ₹1,12,500
                    </text>
                  </svg>
                </div>

                {/* Spend by Agent Bars */}
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                  <div className="pb-3 border-b border-[#222228] mb-3 font-medium text-xs text-[#ededf0]">
                    Spend by agent
                  </div>
                  <div className="space-y-3">
                    {AGENT_DATA.slice(0, 5).map((a) => (
                      <div key={a.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#a1a1aa]">{a.name}</span>
                          <span className="font-mono text-[#ededf0]">{a.spend}</span>
                        </div>
                        <div className="h-1.5 bg-[#1b1b21] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#7dd3c0] rounded-full"
                            style={{ width: `${Math.min(100, (parseInt(a.spend.replace(/[^0-9]/g, "")) / 35000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 7: AUDIT & SECURITY */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                  <div className="pb-2 border-b border-[#222228] mb-2 font-medium text-xs text-[#ededf0]">
                    Audit chain
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">Integrity</span>
                      <span className="text-[#4ade80] font-medium">Verified</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">Entries</span>
                      <span className="font-mono text-[#ededf0]">128,440</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6b6b76]">Last checkpoint</span>
                      <span className="text-[#a1a1aa] font-mono">4m ago</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                  <div className="pb-2 border-b border-[#222228] mb-2 font-medium text-xs text-[#ededf0]">
                    Authentication
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">SSO</span>
                      <span className="text-[#4ade80] font-medium">Enforced</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">Admins</span>
                      <span className="font-mono text-[#ededf0]">7</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6b6b76]">Failed logins (24h)</span>
                      <span className="text-[#ededf0] font-mono">3</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] p-4">
                  <div className="pb-2 border-b border-[#222228] mb-2 font-medium text-xs text-[#ededf0]">
                    Open findings
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">High</span>
                      <span className="text-[#f87171] font-mono font-bold">1</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#222228]">
                      <span className="text-[#6b6b76]">Medium</span>
                      <span className="text-[#f5b942] font-mono font-bold">2</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6b6b76]">Resolved (7d)</span>
                      <span className="text-[#4ade80] font-mono">9</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="bg-[#0e0e11] border border-[#222228] rounded-[10px] overflow-hidden">
                <div className="p-3 border-b border-[#222228] flex items-center justify-between">
                  <span className="font-medium text-xs text-[#ededf0]">Immutable Audit Log</span>
                  <span className="text-[#6b6b76] text-xs">SHA-256 Hash Chain</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#222228] text-[#6b6b76] text-[11.5px]">
                        <th className="p-[8px_16px] font-medium">Time</th>
                        <th className="p-[8px_16px] font-medium">Actor</th>
                        <th className="p-[8px_16px] font-medium">Event</th>
                        <th className="p-[8px_16px] font-medium">Target</th>
                        <th className="p-[8px_16px] font-medium">Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#222228] hover:bg-[#141418]">
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">14:30:47</td>
                        <td className="p-[9px_16px] text-slate-200">policy-engine</td>
                        <td className="p-[9px_16px] text-[#f87171]">Action denied</td>
                        <td className="p-[9px_16px] text-[#a1a1aa]">data-exporter</td>
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">a91f…c2e0</td>
                      </tr>
                      <tr className="border-b border-[#222228] hover:bg-[#141418]">
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">14:12:03</td>
                        <td className="p-[9px_16px] text-slate-200">m.rao@acme.com</td>
                        <td className="p-[9px_16px] text-slate-300">Policy edited</td>
                        <td className="p-[9px_16px] text-[#a1a1aa]">Require approval v7</td>
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">3be7…19d4</td>
                      </tr>
                      <tr className="border-b border-[#222228] hover:bg-[#141418]">
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">13:58:20</td>
                        <td className="p-[9px_16px] text-slate-200">m.rao@acme.com</td>
                        <td className="p-[9px_16px] text-[#7dd3c0]">Approval granted</td>
                        <td className="p-[9px_16px] text-[#a1a1aa]">ex-8d01c</td>
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">e02c…77a1</td>
                      </tr>
                      <tr className="hover:bg-[#141418]">
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">13:20:11</td>
                        <td className="p-[9px_16px] text-slate-200">s.chen@acme.com</td>
                        <td className="p-[9px_16px] text-[#f87171]">Agent suspended</td>
                        <td className="p-[9px_16px] text-[#a1a1aa]">data-exporter</td>
                        <td className="p-[9px_16px] font-mono text-[#6b6b76]">5d4a…b830</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: LIVE FINANCIAL AGENT CONSOLE */}
      {showConsoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConsoleModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-y-auto p-6 z-10 text-slate-900">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-ember-400" />
                <h3 className="text-base font-bold text-white m-0">
                  Interactive Financial AI Agent Console
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsoleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close Agent Console"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Embedded Live Console */}
            <div className="bg-white rounded-xl p-4">
              <AgentTaskConsole />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
