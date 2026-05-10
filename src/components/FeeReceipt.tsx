interface FeeReceiptProps {
  amount: number;
  fee: number;
  payout: number;
  amountLabel?: string;
  payoutLabel?: string;
  className?: string;
}

export function FeeReceipt({
  amount,
  fee,
  payout,
  amountLabel = "Task amount",
  payoutLabel = "Volunteer receives",
  className = "",
}: FeeReceiptProps) {
  const rows = [
    { label: amountLabel, value: amount },
    { label: "Platform fee (5%)", value: fee },
    { label: payoutLabel, value: payout, strong: true },
  ];

  return (
    <div className={`rounded-2xl border bg-muted/50 p-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Payment breakdown
      </p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-4">
            <span className={row.strong ? "font-semibold text-foreground" : undefined}>
              {row.label}
            </span>
            <span className={row.strong ? "font-semibold text-foreground" : undefined}>
              S${row.value.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
