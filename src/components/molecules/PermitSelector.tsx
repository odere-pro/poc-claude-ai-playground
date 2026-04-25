"use client";

import type { Jurisdiction } from "@/lib/types";

interface PermitSelectorProps {
  readonly jurisdiction: Jurisdiction;
  readonly value: string;
  readonly onChange: (next: string) => void;
}

const PERMITS_BY_JURISDICTION: Record<
  Jurisdiction,
  ReadonlyArray<{ id: string; label: string }>
> = {
  nl: [
    { id: "gvva", label: "GVVA (single permit)" },
    { id: "kennismigrant", label: "Kennismigrant (highly skilled)" },
  ],
  se: [{ id: "arbetstillstand", label: "Arbetstillstånd (work permit)" }],
};

export function PermitSelector({ jurisdiction, value, onChange }: PermitSelectorProps) {
  const options = PERMITS_BY_JURISDICTION[jurisdiction];
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">Permit type</span>
      <select
        data-testid="permit-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background h-9 rounded-md border px-3"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
