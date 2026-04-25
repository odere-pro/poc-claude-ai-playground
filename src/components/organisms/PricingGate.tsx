"use client";

import { Button } from "@/components/ui/button";

interface PricingGateProps {
  readonly checkoutUrl?: string;
}

export function PricingGate({ checkoutUrl }: PricingGateProps) {
  const url = checkoutUrl ?? process.env.NEXT_PUBLIC_SOLVIMON_CHECKOUT_URL ?? "#";
  return (
    <div
      data-testid="pricing-gate"
      className="border-border flex flex-col gap-4 rounded-2xl border p-8 text-center"
      style={{
        background: "var(--color-status-permit_conflict-bg)",
        color: "var(--color-status-permit_conflict)",
      }}
    >
      <h2 className="font-semibold" style={{ fontSize: "var(--text-summary-headline)" }}>
        Free analysis used
      </h2>
      <p className="text-sm">
        Upgrade for unlimited contract reviews. Pay only when you need it — no subscription traps.
      </p>
      <div className="flex justify-center">
        <Button
          data-testid="pricing-cta"
          render={
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Upgrade to Individual (opens in new tab)"
            />
          }
        >
          Upgrade to Individual
        </Button>
      </div>
    </div>
  );
}
