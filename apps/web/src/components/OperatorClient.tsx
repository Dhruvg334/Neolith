"use client";

import { useState } from "react";
import { Badge, Button, Card, CardHeader } from "@/components/ui";
import { SecurityPostureHub } from "@/components/SecurityPostureHub";
import {
  activateAgent,
  quarantineAgent,
  restoreSystem,
  runEvaluationSuite,
  triggerEmergencyStop,
  type AgentRegistryDto,
  type EvaluationRunDto,
  type EvaluationScenarioSummaryDto,
  type SystemStateDto,
} from "@/lib/financial-api";

interface OperatorClientProps {
  readonly initialSystemState: SystemStateDto;
  readonly initialAgents: readonly AgentRegistryDto[];
  readonly scenarios: readonly EvaluationScenarioSummaryDto[];
  readonly initialRuns: readonly EvaluationRunDto[];
}

export function OperatorClient({
  initialSystemState,
  initialAgents,
  scenarios,
  initialRuns,
}: OperatorClientProps) {
  // 1. System State (Emergency Stop & Revocation Epoch)
  const [systemState, setSystemState] = useState<SystemStateDto>(initialSystemState);
  const [isSystemToggling, setIsSystemToggling] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);

  // 2. Agents Quarantine State
  const [agents, setAgents] = useState<readonly AgentRegistryDto[]>(initialAgents);
  const [quarantiningAgentId, setQuarantiningAgentId] = useState<string | null>(null);

  // 3. Assurance Lab State
  const [runs, setRuns] = useState<readonly EvaluationRunDto[]>(initialRuns);
  const [activeRun, setActiveRun] = useState<EvaluationRunDto | null>(
    initialRuns.length > 0 && initialRuns[0] ? initialRuns[0] : null
  );
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Handlers for System Kill-Switch
  const handleToggleEmergencyStop = async () => {
    setIsSystemToggling(true);
    setSystemError(null);
    try {
      if (systemState.emergency_stop_active) {
        const res = await restoreSystem("Operator confirmed system restoration");
        if (res.success && res.data) {
          setSystemState(res.data);
        } else {
          setSystemError(res.error ?? "Failed to restore system");
        }
      } else {
        const res = await triggerEmergencyStop("Manual emergency stop triggered via Operator UI");
        if (res.success && res.data) {
          setSystemState(res.data);
        } else {
          setSystemError(res.error ?? "Failed to trigger emergency stop");
        }
      }
    } catch (err) {
      setSystemError(err instanceof Error ? err.message : "Error executing system control");
    } finally {
      setIsSystemToggling(false);
    }
  };

  // Handlers for Agent Quarantine
  const handleToggleAgentStatus = async (agent: AgentRegistryDto) => {
    setQuarantiningAgentId(agent.id);
    try {
      if (agent.status === "active") {
        const res = await quarantineAgent(agent.id);
        if (res.success && res.data) {
          setAgents((prev) =>
            prev.map((a) => (a.id === agent.id ? { ...a, status: "quarantined" } : a))
          );
        }
      } else {
        const res = await activateAgent(agent.id);
        if (res.success && res.data) {
          setAgents((prev) =>
            prev.map((a) => (a.id === agent.id ? { ...a, status: "active" } : a))
          );
        }
      }
    } finally {
      setQuarantiningAgentId(null);
    }
  };

  // Handlers for Evaluation Assurance Lab Run
  const handleRunEvaluation = async () => {
    setIsRunningSuite(true);
    setEvalError(null);
    try {
      const res = await runEvaluationSuite("Neolith Assurance Lab Core");
      if (res.success && res.data) {
        setActiveRun(res.data);
        setRuns((prev) => [res.data as EvaluationRunDto, ...prev]);
      } else {
        setEvalError(res.error ?? "Assurance run failed to complete");
      }
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Error executing assurance suite");
    } finally {
      setIsRunningSuite(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <SecurityPostureHub
        emergencyStopActive={systemState.emergency_stop_active}
        revocationEpoch={systemState.revocation_epoch}
      />

      {/* 1. Cluster-Wide Emergency Kill-Switch & Revocation Epoch (F09 / F13 / UC8) */}
      <Card
        as="section"
        aria-label="Cluster-Wide Emergency Kill-Switch"
        style={{
          borderLeft: systemState.emergency_stop_active
            ? "4px solid var(--danger, #ef4444)"
            : "4px solid var(--success, #22c55e)",
        }}
      >
        <CardHeader
          title="Cluster Emergency Stop & Revocation Epoch Control"
          subtitle="Direct cluster-wide kill-switch. When engaged, all financial execution permits are invalidated and OPA policies reject non-allowlisted actions."
          badge={
            <Badge variant={systemState.emergency_stop_active ? "deny" : "allow"}>
              {systemState.emergency_stop_active ? "EMERGENCY STOP ENGAGED" : "NORMAL CLUSTER STATE"}
            </Badge>
          }
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "6px",
            backgroundColor: "var(--card-bg-subtle, rgba(255,255,255,0.03))",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>
              Active Revocation Epoch
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "monospace" }}>
              EPOCH {systemState.revocation_epoch}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Last State Transition: {new Date(systemState.updated_at).toLocaleString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Button
              variant={systemState.emergency_stop_active ? "primary" : "danger"}
              isLoading={isSystemToggling}
              onClick={handleToggleEmergencyStop}
            >
              {systemState.emergency_stop_active
                ? "Restore Normal Cluster Operations"
                : "Trigger Cluster Emergency Stop"}
            </Button>
          </div>
        </div>

        {systemError && (
          <div
            role="alert"
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "0.85rem",
            }}
          >
            {systemError}
          </div>
        )}
      </Card>

      {/* 2. Agent Quarantine & Lifecycle Administration (UC8) */}
      <Card as="section" aria-label="Agent Quarantine Controls">
        <CardHeader
          title="Agent Quarantine & Authority Controls"
          subtitle="Operators can immediately quarantine rogue or compromised agent identities. Quarantined agents produce deterministic AGENT_INACTIVE denials at the Runtime Gateway."
          badge={<Badge variant="info">{agents.length} AGENTS REGISTERED</Badge>}
        />

        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>Agent Identity</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Active Version</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Permitted Tools</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  style={{ borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))" }}
                >
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <code className="inline-code" style={{ fontWeight: 600 }}>
                      {agent.name}
                    </code>
                    <div style={{ fontSize: "0.775rem", color: "var(--muted)", marginTop: "2px" }}>
                      {agent.description}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <code className="inline-code">v{agent.active_version ?? "1.0.0"}</code>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <Badge variant={agent.status === "active" ? "allow" : "deny"}>
                      {agent.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    {agent.allowed_tools.length} Tools Bound
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                    <Button
                      size="sm"
                      variant={agent.status === "active" ? "danger" : "secondary"}
                      isLoading={quarantiningAgentId === agent.id}
                      onClick={() => handleToggleAgentStatus(agent)}
                    >
                      {agent.status === "active" ? "Quarantine Agent" : "Activate Agent"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Security Assurance Lab & Scenario Verification (F15) */}
      <Card as="section" aria-label="Security & Governance Assurance Lab">
        <CardHeader
          title="F15 Security & Policy Assurance Lab"
          subtitle="Execute reproducible evaluation scenarios against the authoritative Runtime Gateway to verify prompt injection defense, replay prevention, and budget concurrency invariants."
          badge={<Badge variant="info">{runs.length} RUNS RECORDED</Badge>}
          action={
            <Button
              variant="primary"
              size="sm"
              isLoading={isRunningSuite}
              onClick={handleRunEvaluation}
            >
              {isRunningSuite ? "Executing Assurance Lab..." : "Run Assurance Lab Suite"}
            </Button>
          }
        />

        {evalError && (
          <div
            role="alert"
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "0.85rem",
            }}
          >
            {evalError}
          </div>
        )}

        {/* Available Scenarios Overview */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Canonical Safety Scenarios ({scenarios.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {scenarios.map((scen) => (
              <div
                key={scen.id}
                style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border, rgba(255,255,255,0.08))",
                  backgroundColor: "var(--card-bg-subtle, rgba(255,255,255,0.02))",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.85rem" }}>{scen.title}</strong>
                  <Badge variant={scen.expected_decision === "allow" ? "allow" : "deny"}>
                    {scen.expected_decision.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.35rem" }}>
                  File: <code className="inline-code">{scen.scenario_file}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Run Execution Results */}
        {activeRun && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              backgroundColor: "var(--card-bg-subtle, rgba(255,255,255,0.03))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.95rem" }}>Latest Execution Results: {activeRun.suite_name}</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  Run ID: {activeRun.run_id} | Completed: {new Date(activeRun.created_at).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Badge variant={activeRun.scenarios_failed === 0 ? "allow" : "deny"}>
                  {activeRun.scenarios_passed} / {activeRun.scenarios_total} PASSED (
                  {Math.round((activeRun.scenarios_passed / activeRun.scenarios_total) * 100)}%)
                </Badge>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.825rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
                    <th style={{ padding: "0.5rem" }}>Scenario</th>
                    <th style={{ padding: "0.5rem" }}>Expected</th>
                    <th style={{ padding: "0.5rem" }}>Actual Outcome</th>
                    <th style={{ padding: "0.5rem" }}>Reason Codes</th>
                    <th style={{ padding: "0.5rem" }}>Latency</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRun.results.map((res) => (
                    <tr
                      key={res.external_id}
                      style={{ borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.04))" }}
                    >
                      <td style={{ padding: "0.5rem" }}>
                        <strong>{res.title}</strong>
                        <div style={{ fontSize: "0.725rem", color: "var(--muted)" }}>
                          {res.external_id}
                        </div>
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <code className="inline-code">{res.expected_decision}</code>
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <code className="inline-code">{res.actual_decision}</code>
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {res.actual_reason_codes.map((rc) => (
                          <span
                            key={rc}
                            style={{
                              display: "inline-block",
                              fontSize: "0.7rem",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              marginRight: "4px",
                            }}
                          >
                            {rc}
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                        {res.latency_ms}ms
                      </td>
                      <td style={{ padding: "0.5rem", textAlign: "right" }}>
                        <Badge variant={res.passed ? "allow" : "deny"}>
                          {res.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
