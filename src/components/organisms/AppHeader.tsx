"use client";

import Image from "next/image";
import { Logo } from "@/components/atoms/Logo";
import { useReport } from "@/context/ReportContext";

export function AppHeader() {
  const { jurisdiction } = useReport();
  const flag = jurisdiction === "se" ? "/icons/flag-se.svg" : "/icons/flag-nl.svg";
  return (
    <header
      className="flex items-center justify-between border-b px-6 py-4"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <Logo size="md" />
      <span
        className="inline-flex items-center gap-2 text-sm"
        aria-label={`Jurisdiction: ${jurisdiction.toUpperCase()}`}
      >
        <Image src={flag} alt="" width={20} height={14} aria-hidden="true" />
        <span style={{ color: "var(--color-muted-foreground)" }}>{jurisdiction.toUpperCase()}</span>
      </span>
    </header>
  );
}
