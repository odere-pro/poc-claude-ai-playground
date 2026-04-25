"use client";

import { Button } from "@/components/ui/button";
import type { Jurisdiction } from "@/lib/types";

interface JurisdictionToggleProps {
  readonly value: Jurisdiction;
  readonly onChange: (next: Jurisdiction) => void;
}

const OPTIONS: ReadonlyArray<{ id: Jurisdiction; label: string; flag: string }> = [
  { id: "nl", label: "Netherlands", flag: "🇳🇱" },
  { id: "se", label: "Sweden", flag: "🇸🇪" },
];

export function JurisdictionToggle({ value, onChange }: JurisdictionToggleProps) {
  return (
    <div
      data-testid="jurisdiction-toggle"
      className="border-border inline-flex gap-1 rounded-lg border p-1"
    >
      {OPTIONS.map((opt) => (
        <Button
          key={opt.id}
          size="sm"
          variant={value === opt.id ? "default" : "ghost"}
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          data-active={value === opt.id}
        >
          <span aria-hidden="true">{opt.flag}</span>
          <span>{opt.label}</span>
        </Button>
      ))}
    </div>
  );
}
