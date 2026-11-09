"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardHeader, CopyableId } from "@/components/ui";
import { getApiBaseUrl } from "@/lib/financial-api";
import type { FinancialActionProposal, InterfaceResponse, InterfaceResponseStatus } from "@neolith/contracts";

interface ChatTurn {
  readonly id: string;
  readonly role: "user" | "agent";
  readonly text: string;
  readonly status?: InterfaceResponseStatus;
  readonly proposed_action?: FinancialActionProposal | null;
  readonly evidence_refs?: readonly string[];
  readonly timestamp: string;
}

const BENCHMARK_EXAMPLES = [
  "Pay INV-001 if the invoice is valid and within our software budget.",
  "Can we pay INV-002?",
  "Pay INV-003.",
  "What is our Operations Account balance?",
  "Pay the invoice.",
] as const;

export function AgentTaskConsole() {
  const [prompt, setPrompt] = useState<string>(BENCHMARK_EXAMPLES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 2) {
      setErrorMsg("Please enter a financial instruction or inquiry.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const response = await fetch(`${getApiBaseUrl()}/interactions/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          task_id: activeTaskId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Interaction endpoint returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as InterfaceResponse;
      setActiveTaskId(data.task_id);
      setActiveTraceId(data.trace_id);

      const agentTurn: ChatTurn = {
        id: data.interaction_id,
        role: "agent",
        text: data.message,
        status: data.status,
        proposed_action: data.proposed_action,
        evidence_refs: data.evidence_refs,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTurns((prev) => [...prev, agentTurn]);
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : "Unable to reach POST /api/v1/interactions/message on the FastAPI server.";
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadgeVariant(status?: InterfaceResponseStatus): "allow" | "review" | "deny" | "info" {
    switch (status) {
      case "completed":
        return "allow";
      case "proposal_ready":
        return "info";
      case "needs_clarification":
        return "review";
      case "error":
        return "deny";
      default:
        return "info";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Card>
        <CardHeader
          title="Financial AI Agent Multi-Channel Core"
          subtitle="Interact with the unified Financial AI Agent via canonical InteractionTurn. Protected financial execution remains strictly blocked."
        />

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.85rem",
          }}
          role="group"
          aria-label="Benchmark financial prompts"
        >
          {BENCHMARK_EXAMPLES.map((sample) => (
            <Button
              key={sample}
              type="button"
              variant={prompt === sample ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setPrompt(sample);
                setErrorMsg(null);
              }}
            >
              {sample}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="financial-agent-prompt"
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "0.875rem",
              marginBottom: "0.35rem",
            }}
          >
            Financial Goal / Instruction
          </label>
          <textarea
            id="financial-agent-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              marginBottom: "0.75rem",
              background: "var(--surface)",
              color: "inherit",
            }}
            placeholder="e.g. Pay INV-001 if the invoice is valid and within our software budget..."
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Dispatch Turn to Financial Agent
            </Button>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              Routes via <code className="inline-code">POST /api/v1/interactions/message</code> &rarr; LangGraph Agent
            </span>
          </div>
        </form>

        {errorMsg ? (
          <div
            role="alert"
            style={{
              marginTop: "0.85rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "var(--deny-bg)",
              color: "var(--deny-fg)",
              fontSize: "0.88rem",
            }}
          >
            <strong>Interaction Error:</strong> {errorMsg}
          </div>
        ) : null}

        {activeTaskId ? (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface-muted)",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Active Session Task:</span>
            <CopyableId label="task_id" value={activeTaskId} />
            {activeTraceId ? <CopyableId label="trace_id" value={activeTraceId} /> : null}
          </div>
        ) : null}
      </Card>

      {turns.length > 0 ? (
        <Card>
          <CardHeader
            title="Conversation & Interaction Turns"
            subtitle="Canonical InteractionTurn stream showing user inputs, agent responses, evidence references, and proposed actions."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {turns.map((turn) => (
              <div
                key={turn.id}
                style={{
                  padding: "0.9rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: turn.role === "user" ? "var(--surface)" : "var(--surface-muted)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                    {turn.role === "user" ? "👤 User" : "🤖 Financial AI Agent"}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {turn.status ? (
                      <Badge variant={getStatusBadgeVariant(turn.status)}>
                        {turn.status.toUpperCase()}
                      </Badge>
                    ) : null}
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{turn.timestamp}</span>
                  </div>
                </div>

                <p style={{ margin: "0 0 0.5rem 0", lineHeight: 1.5, fontSize: "0.95rem" }}>{turn.text}</p>

                {turn.evidence_refs && turn.evidence_refs.length > 0 ? (
                  <div style={{ marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", marginRight: "0.4rem" }}>
                      Evidence References:
                    </span>
                    <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {turn.evidence_refs.map((ref) => (
                        <code
                          key={ref}
                          className="inline-code"
                          style={{ fontSize: "0.78rem", padding: "0.15rem 0.4rem" }}
                        >
                          {ref}
                        </code>
                      ))}
                    </div>
                  </div>
                ) : null}

                {turn.proposed_action ? (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      padding: "0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <Badge variant="info">PROPOSAL READY</Badge>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        Action: <code className="inline-code">{turn.proposed_action.action_type}</code>
                      </span>
                    </div>

                    <div
                      role="note"
                      style={{
                        padding: "0.6rem 0.75rem",
                        borderRadius: "6px",
                        background: "var(--surface-muted)",
                        borderLeft: "3px solid var(--accent)",
                        fontSize: "0.88rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <strong>Governance Notice:</strong> Neolith governance has not authorised or executed this action yet.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontSize: "0.88rem" }}>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Target ID:</span>{" "}
                        <strong>{turn.proposed_action.target_id}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Amount:</span>{" "}
                        <strong>{turn.proposed_action.currency} {turn.proposed_action.amount ?? "N/A"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Vendor:</span>{" "}
                        <strong>{turn.proposed_action.vendor_name ?? "N/A"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Category:</span>{" "}
                        <strong>{turn.proposed_action.category ?? "N/A"}</strong>
                      </div>
                    </div>

                    <p style={{ margin: "0.6rem 0 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                      <em>Justification: {turn.proposed_action.justification}</em>
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
