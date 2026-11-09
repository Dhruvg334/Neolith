"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          backgroundColor: "#f8fafc",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: "520px",
            width: "100%",
            backgroundColor: "#ffffff",
            padding: "2.5rem 2rem",
            borderRadius: "0.5rem",
            border: "1px solid #cbd5e1",
            textAlign: "center",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
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
              margin: "0 0 0.5rem 0",
              color: "#0f172a",
            }}
          >
            Critical system unavailable
          </h1>

          <p
            style={{
              color: "#334155",
              fontSize: "0.9375rem",
              margin: "0 0 1.5rem 0",
              lineHeight: 1.5,
            }}
          >
            A critical error interrupted Neolith. You can retry the operation or return to the main application.
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.375rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "0.375rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Return home
            </Link>
          </div>

          {error?.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Error reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
