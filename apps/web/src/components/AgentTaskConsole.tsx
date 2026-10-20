"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardHeader, CopyableId } from "@/components/ui";
import { getApiBaseUrl, type TaskRecordDto } from "@/lib/financial-api";

const EXAMPLE_PROMPTS = [
  "Check account balance and unpaid invoices",
  "Pay invoice INV-001 for Acme Cloud",
  "Pay invoice INV-002 for Nova Compute",
  "Pay invoice INV-003 for Unknown Supplies",
] as const;

export function AgentTaskConsole() {
  const [prompt, setPrompt] = useState<string>(EXAMPLE_PROMPTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [createdTask, setCreatedTask] = useState<TaskRecordDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      setErrorMsg("Please enter a financial task prompt of at least 3 characters.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          original_request: trimmed,
          objective: `Financial Agent evaluation: ${trimmed}`,
          constraints: {
            organisation: "Neolith Demo Corp",
            currency: "INR",
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Task submission returned HTTP ${response.status}`);
      }
      const record = (await response.json()) as TaskRecordDto;
      setCreatedTask(record);
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : "Unable to reach POST /api/v1/tasks on the FastAPI server.";
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Submit Financial Task to financial-ai-agent"
        subtitle="Select a benchmark scenario prompt or enter a custom instruction. Stage 1 records the task and binds read-only FinancialContext; protected payment execution is gated by the Runtime Gateway in Stage 2."
      />

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.85rem",
        }}
        role="group"
        aria-label="Example financial agent prompts"
      >
        {EXAMPLE_PROMPTS.map((sample) => (
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
          }}
          placeholder="Describe the financial operation or inquiry for Neolith Demo Corp..."
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Button type="submit" variant="primary" isLoading={submitting}>
            Create Financial Task Record
          </Button>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            Persists via <code className="inline-code">POST /api/v1/tasks</code>{" "}
            — No direct payment side-effects
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
          <strong>Task API Notice:</strong> {errorMsg}
        </div>
      ) : null}

      {createdTask ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface-muted)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.4rem",
            }}
          >
            <strong>Task Registered in Control Plane</strong>
            <Badge variant="info">{createdTask.state.toUpperCase()}</Badge>
          </div>
          <p className="card-copy" style={{ marginBottom: "0.5rem" }}>
            Request: <strong>{createdTask.original_request}</strong>
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <CopyableId label="task_id" value={createdTask.id} />
            {createdTask.trace_id ? (
              <CopyableId label="trace_id" value={createdTask.trace_id} />
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
