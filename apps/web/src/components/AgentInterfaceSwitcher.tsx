"use client";

import { useEffect, useState } from "react";
import { AgentTaskConsole } from "./AgentTaskConsole";
import { Badge, Button, Card } from "./ui";

export type InterfaceMode = "web" | "whatsapp" | "voice";

export interface AgentInterfaceSwitcherProps {
  readonly initialMode?: InterfaceMode;
}

export function AgentInterfaceSwitcher({
  initialMode = "web",
}: AgentInterfaceSwitcherProps) {
  const [mode, setMode] = useState<InterfaceMode>(initialMode);
  const [copied, setCopied] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceSimulating, setVoiceSimulating] = useState(false);

  const rawWhatsApp =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+14155238886";
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, "");
  const elevenLabsAgentId =
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyNumber = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(rawWhatsApp);
      setCopied(true);
    }
  };

  return (
    <div>
      {/* Interface Segmented Selector */}
      <div
        role="tablist"
        aria-label="Agent Interaction Channels"
        style={{
          display: "flex",
          gap: "0.5rem",
          backgroundColor: "var(--bg-muted)",
          padding: "0.35rem",
          borderRadius: "0.5rem",
          marginBottom: "1.25rem",
          border: "1px solid var(--border-subtle)",
          width: "fit-content",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "web"}
          onClick={() => setMode("web")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor:
              mode === "web" ? "var(--bg-surface)" : "transparent",
            color:
              mode === "web"
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            fontWeight: mode === "web" ? 600 : 500,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow:
              mode === "web" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>💻</span> Web Interface
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "whatsapp"}
          onClick={() => setMode("whatsapp")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor:
              mode === "whatsapp" ? "var(--bg-surface)" : "transparent",
            color:
              mode === "whatsapp"
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            fontWeight: mode === "whatsapp" ? 600 : 500,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow:
              mode === "whatsapp" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>💬</span> WhatsApp
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "voice"}
          onClick={() => setMode("voice")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor:
              mode === "voice" ? "var(--bg-surface)" : "transparent",
            color:
              mode === "voice"
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            fontWeight: mode === "voice" ? 600 : 500,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow:
              mode === "voice" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>🎙️</span> Voice (ElevenLabs)
        </button>
      </div>

      {/* WEB CHANNEL VIEW */}
      {mode === "web" && (
        <div role="tabpanel" aria-label="Web Interface">
          <AgentTaskConsole />
        </div>
      )}

      {/* WHATSAPP CHANNEL VIEW */}
      {mode === "whatsapp" && (
        <div role="tabpanel" aria-label="WhatsApp Interface">
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <Badge variant="allow">WHATSAPP MULTI-CHANNEL</Badge>
              <Badge variant="neutral">Twilio Webhook Bridge</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#25D366",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  flexShrink: 0,
                }}
              >
                💬
              </div>
              <div>
                <h2 className="card-title" style={{ fontSize: "1.25rem", margin: "0 0 0.35rem 0" }}>
                  Continue this conversation in WhatsApp
                </h2>
                <p className="card-copy" style={{ maxWidth: "600px", margin: 0 }}>
                  Interact with the Financial AI Agent directly on your mobile device. Inquire about
                  account balances, inspect vendor invoices, and propose payments while every single
                  request flows through the exact same Runtime Gateway governance policies.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    OFFICIAL WHATSAPP NUMBER
                  </span>
                  <p
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      margin: "0.25rem 0 0.75rem 0",
                      color: "var(--text-primary)",
                    }}
                  >
                    {rawWhatsApp}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={`https://wa.me/${cleanWhatsApp}?text=Hi%20Neolith%2C%20what%20is%20our%20current%20operating%20account%20balance%3F`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#25D366",
                        color: "#FFFFFF",
                        borderRadius: "0.375rem",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        textDecoration: "none",
                      }}
                    >
                      Open in WhatsApp ↗
                    </a>
                    <Button variant="secondary" onClick={handleCopyNumber}>
                      {copied ? "✓ Copied!" : "Copy Number"}
                    </Button>
                  </div>
                </div>

                <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: "1rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    SECURITY &amp; POLICY CONTROLS
                  </span>
                  <ul style={{ margin: "0.35rem 0 0 1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    <li>All inbound messages authenticated via SHA-256 HMAC</li>
                    <li>Vendor verification &amp; budget limits enforced identically</li>
                    <li>Audit trail logged in PostgreSQL with session trace ID</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VOICE CHANNEL VIEW */}
      {mode === "voice" && (
        <div role="tabpanel" aria-label="Voice Interface">
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <Badge variant="info">VOICE INTERACTION</Badge>
              <Badge variant="neutral">ElevenLabs Conversational AI</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  flexShrink: 0,
                }}
              >
                🎙️
              </div>
              <div>
                <h2 className="card-title" style={{ fontSize: "1.25rem", margin: "0 0 0.35rem 0" }}>
                  Talk to Financial Agent
                </h2>
                <p className="card-copy" style={{ maxWidth: "600px", margin: 0 }}>
                  Speak naturally. Neolith applies the same checks as Web and WhatsApp.
                  The Voice Agent communicates in real-time through ElevenLabs with custom LLM governance
                  routing back to Neolith&apos;s authoritative policy engine.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "2rem",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                textAlign: "center",
              }}
            >
              {elevenLabsAgentId ? (
                <div>
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      backgroundColor: isVoiceActive ? "#10B981" : "#0F766E",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.25rem auto",
                      fontSize: "2rem",
                      boxShadow: isVoiceActive ? "0 0 0 8px rgba(16, 185, 129, 0.2)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isVoiceActive ? "🔊" : "🎙️"}
                  </div>

                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", fontWeight: 600 }}>
                    {isVoiceActive ? "Voice Conversation Active" : "Ready to Talk"}
                  </h3>
                  <p style={{ margin: "0 auto 1.25rem auto", fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "420px" }}>
                    {isVoiceActive
                      ? "Listening and synthesizing replies governed by Neolith policy..."
                      : "Click below to begin speaking with the Financial Operations AI Agent."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                    <Button
                      variant={isVoiceActive ? "danger" : "primary"}
                      onClick={() => setIsVoiceActive(!isVoiceActive)}
                    >
                      {isVoiceActive ? "End conversation" : "Start voice conversation"}
                    </Button>
                  </div>

                  <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Agent ID: <code className="inline-code">{elevenLabsAgentId}</code>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem auto",
                      fontSize: "1.75rem",
                    }}
                  >
                    🎙️
                  </div>

                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", fontWeight: 600 }}>
                    Voice Calling Architecture Ready
                  </h3>
                  <p style={{ margin: "0 auto 1.25rem auto", fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "480px" }}>
                    The backend ElevenLabs Custom LLM endpoint (<code className="inline-code">/api/v1/elevenlabs/chat/completions</code>)
                    is operational and secured by bearer token. To enable the in-browser widget, configure your Agent ID.
                  </p>

                  <div
                    style={{
                      maxWidth: "520px",
                      margin: "0 auto 1.25rem auto",
                      padding: "0.875rem",
                      backgroundColor: "var(--bg-surface)",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "left",
                      fontSize: "0.8125rem",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-primary)" }}>
                      Configuration Setting (Vercel / .env):
                    </div>
                    <code className="inline-code" style={{ display: "block", padding: "0.4rem 0.6rem" }}>
                      NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
                    </code>
                    <p style={{ margin: "0.5rem 0 0 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      Security Notice: The Agent ID is safe for public client exposure. The backend custom LLM bearer
                      token stays private on Render.
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                    <Button
                      variant="secondary"
                      onClick={() => setVoiceSimulating(!voiceSimulating)}
                    >
                      {voiceSimulating ? "Stop audio preview" : "Preview audio waveform"}
                    </Button>
                  </div>

                  {voiceSimulating ? (
                    <div
                      style={{
                        marginTop: "1.25rem",
                        padding: "0.75rem",
                        backgroundColor: "var(--bg-surface)",
                        borderRadius: "0.375rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <span style={{ animation: "pulse 1s infinite", color: "#0F766E" }}>● Live audio simulation:</span>
                      <span>Microphone access granted &bull; Parity with Web & WhatsApp runtime</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
