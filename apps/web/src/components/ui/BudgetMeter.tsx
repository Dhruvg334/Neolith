export interface BudgetMeterProps {
  readonly label: string;
  readonly currency: string;
  readonly limitAmount: string;
  readonly committedAmount: string;
  readonly reservedAmount: string;
  readonly availableAmount: string;
}

function parseMinorUnits(decimalString: string): bigint {
  const trimmed = decimalString.trim();
  const [wholePart = "0", fracPart = ""] = trimmed.split(".");
  const normalizedFrac = (fracPart + "00").slice(0, 2);
  return BigInt(wholePart) * 100n + BigInt(normalizedFrac);
}

export function BudgetMeter({
  label,
  currency,
  limitAmount,
  committedAmount,
  reservedAmount,
  availableAmount,
}: BudgetMeterProps) {
  const limitMinor = parseMinorUnits(limitAmount);
  const committedMinor = parseMinorUnits(committedAmount);
  const reservedMinor = parseMinorUnits(reservedAmount);

  const committedPct =
    limitMinor > 0n
      ? Math.min(100, Number((committedMinor * 10000n) / limitMinor) / 100)
      : 0;
  const reservedPct =
    limitMinor > 0n
      ? Math.min(
          100 - committedPct,
          Number((reservedMinor * 10000n) / limitMinor) / 100,
        )
      : 0;

  return (
    <div aria-label={`Budget meter for ${label}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>
          Available: {currency} {availableAmount} / {currency} {limitAmount}
        </span>
      </div>
      <div className="ui-budget-track" role="img" aria-label="Budget usage bar">
        <div
          className="ui-budget-committed"
          style={{ width: `${committedPct}%` }}
          title={`Committed: ${currency} ${committedAmount}`}
        />
        <div
          className="ui-budget-reserved"
          style={{ width: `${reservedPct}%` }}
          title={`Reserved: ${currency} ${reservedAmount}`}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
          flexWrap: "wrap",
        }}
      >
        <span>
          Committed: <strong>{currency} {committedAmount}</strong>
        </span>
        <span>
          Reserved (In-Flight): <strong>{currency} {reservedAmount}</strong>
        </span>
        <span>
          Remaining: <strong>{currency} {availableAmount}</strong>
        </span>
      </div>
    </div>
  );
}
