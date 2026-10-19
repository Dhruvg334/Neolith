import type { ReactNode } from "react";
import type { DecisionOutcome } from "@neolith/contracts";

export type BadgeVariant = "neutral" | "allow" | "deny" | "review" | "info";
export type RiskTier = "R0" | "R1" | "R2" | "R3" | "R4";

interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly icon?: string;
  readonly children: ReactNode;
}

const VARIANT_ICONS: Record<BadgeVariant, string> = {
  neutral: "•",
  allow: "✓",
  deny: "✕",
  review: "!",
  info: "i",
};

export function Badge({ variant = "neutral", icon, children }: BadgeProps) {
  const variantClass =
    variant === "neutral" ? "ui-badge" : `ui-badge ui-badge-${variant}`;
  const glyph = icon ?? VARIANT_ICONS[variant];

  return (
    <span className={variantClass}>
      <span aria-hidden="true">{glyph}</span>
      <span>{children}</span>
    </span>
  );
}

interface DecisionBadgeProps {
  readonly decision: DecisionOutcome;
}

const DECISION_LABELS: Record<
  DecisionOutcome,
  { label: string; variant: BadgeVariant }
> = {
  allow: { label: "ALLOW", variant: "allow" },
  deny: { label: "DENY", variant: "deny" },
  review: { label: "REVIEW REQUIRED", variant: "review" },
  allow_with_constraints: {
    label: "ALLOW WITH CONSTRAINTS",
    variant: "info",
  },
};

export function DecisionBadge({ decision }: DecisionBadgeProps) {
  const descriptor = DECISION_LABELS[decision];
  return <Badge variant={descriptor.variant}>{descriptor.label}</Badge>;
}

interface RiskTierBadgeProps {
  readonly tier: RiskTier;
}

const RISK_VARIANTS: Record<RiskTier, { label: string; variant: BadgeVariant }> =
  {
    R0: { label: "R0 · Public Read", variant: "allow" },
    R1: { label: "R1 · Internal Read", variant: "info" },
    R2: { label: "R2 · Reversible Write", variant: "info" },
    R3: { label: "R3 · Material Action", variant: "review" },
    R4: { label: "R4 · High / Irreversible", variant: "deny" },
  };

export function RiskTierBadge({ tier }: RiskTierBadgeProps) {
  const descriptor = RISK_VARIANTS[tier];
  return <Badge variant={descriptor.variant}>{descriptor.label}</Badge>;
}
