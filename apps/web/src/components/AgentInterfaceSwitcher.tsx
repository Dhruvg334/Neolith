"use client";

import { useState } from "react";
import {
  Terminal,
  MessageSquare,
  Mic,
  Lock,
  ShieldCheck,
  Bell,
  FileText,
  Scale,
} from "lucide-react";
import { AgentTaskConsole } from "./AgentTaskConsole";
import { Badge, Card } from "./ui";

export type InterfaceMode = "web" | "whatsapp" | "voice";

export interface AgentInterfaceSwitcherProps {
  readonly initialMode?: InterfaceMode;
}

// Multi-channel interface locks — toggled when ready to unlock external adapters
const IS_TWILIO_UNLOCKED = false;
const IS_CONVERSATIONAL_AGENT_UNLOCKED = false;

export function AgentInterfaceSwitcher({
  initialMode = "web",
}: AgentInterfaceSwitcherProps) {
  const [mode, setMode] = useState<InterfaceMode>(initialMode);

  return (
    <div>
      {/* Interface Segmented Selector */}
      <div
        role="tablist"
        aria-label="Agent Interaction Channels"
        className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-5 w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "web"}
          onClick={() => setMode("web")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 ${
            mode === "web"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Terminal className="w-4 h-4 text-slate-700" />
          <span>Web Console</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Active
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "whatsapp"}
          onClick={() => setMode("whatsapp")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 ${
            mode === "whatsapp"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <span>Twilio Mobile Dispatch</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>In Dev</span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "voice"}
          onClick={() => setMode("voice")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 ${
            mode === "voice"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Mic className="w-4 h-4 text-blue-600" />
          <span>Conversational Financial Agent</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>In Dev</span>
          </span>
        </button>
      </div>

      {/* WEB CHANNEL VIEW */}
      {mode === "web" && (
        <div role="tabpanel" aria-label="Web Interface">
          <AgentTaskConsole />
        </div>
      )}

      {/* WHATSAPP & SMS (TWILIO) CHANNEL VIEW */}
      {mode === "whatsapp" && (
        <div role="tabpanel" aria-label="Twilio Mobile Dispatch Interface">
          {!IS_TWILIO_UNLOCKED ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="review">CURRENTLY IN DEVELOPMENT</Badge>
                  <Badge variant="neutral">Twilio Gateway Integration</Badge>
                </div>
                <span className="text-xs font-mono text-slate-500">Status: Staged Development</span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    Twilio Multi-Channel Mobile Dispatch
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed m-0">
                    Automated WhatsApp and SMS operational alerts, multi-channel approvals, and mobile inquiries
                    powered by Twilio gateway integrations.
                  </p>
                </div>
              </div>

              {/* In Development Explanation Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 mb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">
                    Feature Status • Development in Progress
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed m-0">
                  The Twilio mobile communication gateway is currently undergoing security hardening and end-to-end policy
                  verification. Once unlocked, authorized operators will be able to review operating account balances, receive
                  instant threshold alerts, and confirm pending invoices directly from their mobile devices.
                </p>
              </div>

              {/* Feature Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> Authenticated Messaging
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Inbound mobile interactions are authenticated via cryptographic signatures with zero ambient authority.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-teal-600" /> Full Policy Parity
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Mobile proposals pass through the identical OPA policy rules, budget reservations, and audit trail.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-600" /> Real-Time Push Alerts
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Instant alerts dispatched to finance managers when transactions require human checkpoint verification.
                  </p>
                </div>
              </div>

              {/* Action Locked State */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-xs text-slate-500">
                  <span>Channel availability: </span>
                  <strong className="text-slate-700">Scheduled for upcoming platform update</strong>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Channel In Development</span>
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
                <Badge variant="allow">WHATSAPP MULTI-CHANNEL</Badge>
                <Badge variant="neutral">Twilio Mobile Gateway</Badge>
              </div>
              <p className="text-sm text-slate-600">
                Mobile messaging channel unlocked.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* CONVERSATIONAL FINANCIAL AGENT (VOICE) CHANNEL VIEW */}
      {mode === "voice" && (
        <div role="tabpanel" aria-label="Conversational Financial Agent Interface">
          {!IS_CONVERSATIONAL_AGENT_UNLOCKED ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="review">CURRENTLY IN DEVELOPMENT</Badge>
                  <Badge variant="neutral">Conversational Voice Runtime</Badge>
                </div>
                <span className="text-xs font-mono text-slate-500">Status: Staged Development</span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Mic className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    Conversational Financial Agent
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed m-0">
                    Real-time voice and conversational financial operations assistant enabling operators to review budgets,
                    inspect invoices, and propose transactions through natural spoken dialogue.
                  </p>
                </div>
              </div>

              {/* In Development Explanation Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 mb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">
                    Feature Status • Development in Progress
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed m-0">
                  The Conversational Financial Agent is currently undergoing safety verification and voice latency optimization.
                  When unlocked, finance teams can interact through natural conversational speech while every proposed transaction
                  remains strictly evaluated by corporate governance policies.
                </p>
              </div>

              {/* Feature Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-teal-600" /> Natural Voice Dialogue
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Hands-free verbal inquiries for ledger balances, spending caps, and pending vendor invoices.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> Zero Implicit Authority
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    The conversational agent cannot execute payments directly. Single-use cryptographic permits are strictly required.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" /> Immutable Audit Logs
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Spoken interactions and proposed decisions are hashed and permanently recorded in the decision receipt chain.
                  </p>
                </div>
              </div>

              {/* Action Locked State */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-xs text-slate-500">
                  <span>Channel availability: </span>
                  <strong className="text-slate-700">Scheduled for upcoming platform update</strong>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Agent In Development</span>
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
                <Badge variant="info">VOICE INTERACTION</Badge>
                <Badge variant="neutral">Conversational Voice Runtime</Badge>
              </div>
              <p className="text-sm text-slate-600">
                Conversational Financial Agent unlocked.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
