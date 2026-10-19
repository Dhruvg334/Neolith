"use client";

import { useState } from "react";

export interface CopyableIdProps {
  readonly label?: string;
  readonly value: string;
}

export function CopyableId({ label, value }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="ui-copyable-id">
      {label ? <strong>{label}:</strong> : null}
      <code>{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="ui-btn ui-btn-ghost ui-btn-sm"
        style={{ padding: "0.1rem 0.35rem", fontSize: "0.7rem" }}
        aria-label={`Copy ${label ?? "identifier"} ${value}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
