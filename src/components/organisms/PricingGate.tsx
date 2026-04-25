"use client";

import { Button } from "@/components/atoms/Button";

interface PricingGateProps {
  readonly onClose: () => void;
}

const TIERS = [
  {
    id: "ngo",
    label: "NGO",
    price: "Free for NGOs",
    description: "Unlimited analyses for vetted refugee-aid organizations.",
    cta: { label: "Apply for access", href: "https://solvimon.com/ngo" },
  },
  {
    id: "individual",
    label: "Individual",
    price: "€9 / month",
    description: "5 analyses per month for personal use.",
    cta: { label: "Subscribe", href: "https://solvimon.com/checkout/individual" },
  },
  {
    id: "municipality",
    label: "Municipality",
    price: "Custom",
    description: "Volume tier for city offices and labor unions.",
    cta: { label: "Contact sales", href: "https://solvimon.com/contact" },
  },
] as const;

export function PricingGate({ onClose }: PricingGateProps) {
  return (
    <div
      data-testid="pricing-gate"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgb(0 0 0 / 0.5)" }}
    >
      <div
        className="flex max-w-2xl flex-col gap-4 rounded-lg p-6"
        style={{ backgroundColor: "var(--color-card)" }}
      >
        <header>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Analysis limit reached
          </h2>
          <p style={{ color: "var(--color-muted-foreground)" }}>
            You&apos;ve hit the free quota. Pick a plan or come back next month.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <article
              key={t.id}
              data-testid={`pricing-tier-${t.id}`}
              className="flex flex-col gap-2 rounded-md p-4"
              style={{ backgroundColor: "var(--color-bg-inset)" }}
            >
              <h3 className="font-semibold">{t.label}</h3>
              <p className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                {t.price}
              </p>
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {t.description}
              </p>
              <a
                href={t.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline-offset-2 hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                {t.cta.label} →
              </a>
            </article>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
