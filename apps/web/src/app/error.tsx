"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RootError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log error cleanly for client-side diagnostics without leaking stack traces
    console.error("Neolith application error boundary caught:", error.message);
  }, [error]);

  return (
    <main
      role="alert"
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        padding: "2.5rem 2rem",
        backgroundColor: "var(--bg-surface)",
        borderRadius: "0.5rem",
        border: "1px solid var(--border-subtle)",
        textAlign: "center",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--status-deny-bg)",
          color: "var(--status-deny-text)",
          border: "1px solid var(--status-deny-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto",
          fontSize: "1.25rem",
          fontWeight: 700,
        }}
      >
        ⚠️
      </div>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 0.5rem 0",
        }}
      >
        Secure service unavailable
      </h1>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          margin: "0 auto 1.5rem auto",
          lineHeight: 1.5,
          maxWidth: "420px",
        }}
      >
        We couldn&apos;t reach Neolith&apos;s secure service. Please try again or return home.
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
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
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

      <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {showDetails ? "Hide technical details" : "View technical details"}
        </button>

        {showDetails ? (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              backgroundColor: "var(--bg-muted)",
              borderRadius: "0.375rem",
              textAlign: "left",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              wordBreak: "break-all",
            }}
          >
            <div><strong>Error:</strong> {error.message || "An unexpected error occurred."}</div>
            {error.digest ? <div><strong>Digest:</strong> {error.digest}</div> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
