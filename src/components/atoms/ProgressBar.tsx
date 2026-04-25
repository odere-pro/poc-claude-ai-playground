interface ProgressBarProps {
  readonly value?: number;
  readonly animated?: boolean;
  readonly color?: "brand" | "danger" | "warning";
  readonly label?: string;
}

const COLOR_TOKEN: Record<NonNullable<ProgressBarProps["color"]>, string> = {
  brand: "var(--color-primary)",
  danger: "var(--color-status-illegal)",
  warning: "var(--color-status-exploitative)",
};

export function ProgressBar({ value, animated = false, color = "brand", label }: ProgressBarProps) {
  const determinate = typeof value === "number";
  const pct = determinate ? Math.max(0, Math.min(100, value!)) : null;

  return (
    <div
      role="progressbar"
      aria-label={label ?? "Progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
      className="relative h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "var(--color-bg-inset)" }}
    >
      {determinate ? (
        <div
          className="h-full transition-[width]"
          style={{
            width: `${pct}%`,
            backgroundColor: COLOR_TOKEN[color],
            transitionDuration: "var(--duration-normal)",
          }}
        />
      ) : (
        <div
          className={`h-full ${animated ? "animate-pulse" : ""}`}
          style={{
            width: "30%",
            backgroundColor: COLOR_TOKEN[color],
            animation: animated ? "cgShimmer 1.6s var(--ease-out-expo) infinite" : undefined,
          }}
        />
      )}
      <style>{`
        @keyframes cgShimmer {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </div>
  );
}
