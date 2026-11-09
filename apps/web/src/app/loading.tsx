export default function RootLoading() {
  return (
    <div
      aria-label="Loading content"
      aria-busy="true"
      style={{
        maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          height: "80px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "0.5rem",
          border: "1px solid var(--border-subtle)",
          opacity: 0.6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />

      {/* Grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            height: "140px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "0.5rem",
            border: "1px solid var(--border-subtle)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            height: "140px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "0.5rem",
            border: "1px solid var(--border-subtle)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            height: "140px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "0.5rem",
            border: "1px solid var(--border-subtle)",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Main card skeleton */}
      <div
        style={{
          height: "300px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "0.5rem",
          border: "1px solid var(--border-subtle)",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
