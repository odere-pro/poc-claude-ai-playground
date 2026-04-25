"use client";

import { useId, useState, type ReactNode } from "react";

interface ExpanderSectionProps {
  readonly label: string;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

export function ExpanderSection({ label, defaultOpen = false, children }: ExpanderSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--color-border)" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>{label}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div
        id={id}
        role="region"
        aria-hidden={!open}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows var(--duration-normal) var(--ease-out-expo)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="px-3 py-2 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
