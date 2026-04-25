"use client";

import { useEffect } from "react";

type ToastType = "info" | "warning" | "error" | "speaking";

interface ToastProps {
  readonly message: string;
  readonly type?: ToastType;
  readonly duration?: number;
  readonly onDismiss: () => void;
}

const TYPE_BORDER: Record<ToastType, string> = {
  info: "var(--color-primary)",
  warning: "var(--color-status-exploitative)",
  error: "var(--color-status-illegal)",
  speaking: "var(--color-status-compliant)",
};

export function Toast({ message, type = "info", duration = 4500, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border-l-4 px-4 py-3 shadow-md"
      style={{
        borderLeftColor: TYPE_BORDER[type],
        backgroundColor: "var(--color-card)",
        color: "var(--color-card-foreground)",
        animation: type === "speaking" ? "cgPulse 1.4s ease-in-out infinite" : undefined,
      }}
    >
      {message}
      <style>{`
        @keyframes cgPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--color-status-compliant-bg); }
          50%      { box-shadow: 0 0 0 6px transparent; }
        }
      `}</style>
    </div>
  );
}
