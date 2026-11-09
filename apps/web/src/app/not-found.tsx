import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        padding: "3rem 2rem",
        backgroundColor: "var(--bg-surface)",
        borderRadius: "0.5rem",
        border: "1px solid var(--border-subtle)",
        textAlign: "center",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--status-info-bg)",
          color: "var(--status-info-text)",
          border: "1px solid var(--status-info-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto",
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 0.5rem 0",
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "1rem",
          margin: "0 auto 1.75rem auto",
          lineHeight: 1.5,
          maxWidth: "440px",
        }}
      >
        The page you are looking for does not exist or has been moved. Check the URL or return to the dashboard.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-surface)",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Return home
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "1px solid var(--border-subtle)",
          }}
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
