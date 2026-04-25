"use client";

import Image from "next/image";
import type { Jurisdiction } from "@/lib/types";

interface JurisdictionToggleProps {
  readonly value: Jurisdiction;
  readonly onChange: (next: Jurisdiction) => void;
}

const OPTIONS: ReadonlyArray<{
  readonly id: Jurisdiction;
  readonly label: string;
  readonly flag: string;
}> = [
  { id: "nl", label: "Netherlands", flag: "/icons/flag-nl.svg" },
  { id: "se", label: "Sweden", flag: "/icons/flag-se.svg" },
];

export function JurisdictionToggle({ value, onChange }: JurisdictionToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Jurisdiction"
      data-testid="jurisdiction-toggle"
      data-value={value}
      className="inline-flex rounded-full p-1"
      style={{ backgroundColor: "var(--color-bg-inset)" }}
    >
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={opt.id}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-opacity"
            style={{
              backgroundColor: active ? "var(--color-primary)" : "transparent",
              color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
            }}
            onClick={() => onChange(opt.id)}
          >
            <Image src={opt.flag} alt="" width={16} height={11} aria-hidden="true" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
