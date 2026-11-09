"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/Button";

export interface ErrorStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly isStarting?: boolean;
  readonly details?: string;
  readonly onRetry?: () => void;
  readonly compact?: boolean;
}

export function ErrorState({
  title,
  message,
  isStarting = false,
  details,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const displayTitle =
    title ?? (isStarting ? "Starting secure service" : "Secure service unavailable");

  const displayMessage =
    message ??
    (isStarting
      ? "Neolith is reconnecting. This can take a moment after inactivity."
      : "We couldn't reach Neolith's secure service.");

  return (
    <div
      role="alert"
      style={{
        padding: compact ? "1.25rem" : "2.5rem 1.5rem",
        textAlign: "center",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "0.5rem",
        maxWidth: compact ? "100%" : "640px",
        margin: compact ? "0.5rem 0" : "2rem auto",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: isStarting ? "var(--status-review-bg)" : "var(--status-deny-bg)",
          color: isStarting ? "var(--status-review-text)" : "var(--status-deny-text)",
          border: `1px solid ${isStarting ? "var(--status-review-border)" : "var(--status-deny-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1rem auto",
          fontSize: "1.25rem",
          fontWeight: 700,
        }}
      >
        {isStarting ? "⏳" : "⚠️"}
      </div>

      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 0.5rem 0",
        }}
      >
        {displayTitle}
      </h3>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          margin: "0 auto 1.5rem auto",
          maxWidth: "460px",
          lineHeight: 1.5,
        }}
      >
        {displayMessage}
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "1px solid var(--border-subtle)",
          }}
        >
          Return home
        </Link>
      </div>

      {details ? (
        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              padding: "0.25rem",
              textDecoration: "underline",
              display: "block",
              margin: "0 auto",
            }}
          >
            {showDetails ? "Hide technical details" : "View technical details"}
          </button>
          {showDetails ? (
            <pre
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "160px",
                overflowY: "auto",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {details}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
