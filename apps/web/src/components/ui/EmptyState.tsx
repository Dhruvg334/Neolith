import type { ReactNode } from "react";

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "2rem 1.5rem",
        textAlign: "center",
        border: "1px dashed var(--border-subtle)",
        borderRadius: "0.5rem",
        backgroundColor: "var(--bg-page)",
      }}
    >
      <h3 className="card-title">{title}</h3>
      <p className="card-copy" style={{ maxWidth: "56ch", margin: "0 auto" }}>
        {description}
      </p>
      {action ? <div style={{ marginTop: "1rem" }}>{action}</div> : null}
    </div>
  );
}
