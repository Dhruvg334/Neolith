import { Badge, type BadgeVariant } from "./Badge";

export type StepLayer = "ai" | "governance" | "enterprise";
export type StepState = "pending" | "active" | "completed" | "denied" | "review";

export interface TimelineStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly layer: StepLayer;
  readonly state: StepState;
  readonly timestamp?: string;
}

export interface StatusTimelineProps {
  readonly steps: readonly TimelineStep[];
}

const LAYER_LABELS: Record<StepLayer, string> = {
  ai: "AI Agent Layer",
  governance: "Governance Control Layer",
  enterprise: "Enterprise Service Layer",
};

const STATE_BADGES: Record<StepState, { label: string; variant: BadgeVariant }> =
  {
    pending: { label: "Pending", variant: "neutral" },
    active: { label: "In Progress", variant: "info" },
    completed: { label: "Verified", variant: "allow" },
    denied: { label: "Denied", variant: "deny" },
    review: { label: "Awaiting Approval", variant: "review" },
  };

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <ol className="ui-timeline" aria-label="Execution and governance timeline">
      {steps.map((step) => {
        const statusInfo = STATE_BADGES[step.state];
        return (
          <li key={step.id} className="ui-timeline-item">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                  flexWrap: "wrap",
                }}
              >
                <strong>{step.title}</strong>
                <Badge variant="neutral">{LAYER_LABELS[step.layer]}</Badge>
              </div>
              <p className="card-copy">{step.description}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {step.timestamp ? (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {step.timestamp}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
