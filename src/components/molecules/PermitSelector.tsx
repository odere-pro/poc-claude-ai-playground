"use client";

import { useEffect, useState } from "react";
import type { Jurisdiction, PermitCategories } from "@/lib/types";

interface PermitSelectorProps {
  readonly jurisdiction: Jurisdiction;
  readonly value: string;
  readonly onChange: (id: string) => void;
}

export function PermitSelector({ jurisdiction, value, onChange }: PermitSelectorProps) {
  const [permits, setPermits] = useState<PermitCategories | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mod =
        jurisdiction === "se"
          ? await import("@/../data/se-permit-categories.json")
          : await import("@/../data/nl-permit-categories.json");
      if (!cancelled) {
        setPermits(mod.default as unknown as PermitCategories);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jurisdiction]);

  if (!permits) {
    return (
      <div
        className="h-11 w-full rounded-md"
        style={{ backgroundColor: "var(--color-bg-inset)" }}
      />
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span
        className="text-xs tracking-wide uppercase"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Permit type
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="permit-selector"
        className="h-11 rounded-md border px-3"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-foreground)",
        }}
      >
        {permits.permits.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
