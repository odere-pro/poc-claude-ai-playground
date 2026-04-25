"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JurisdictionToggle } from "@/components/molecules/JurisdictionToggle";
import { PermitSelector } from "@/components/molecules/PermitSelector";
import { UploadZone } from "@/components/organisms/UploadZone";
import { SessionRestoreBanner } from "@/components/organisms/SessionRestoreBanner";
import { useReport } from "@/context/ReportContext";
import { useAnalyze } from "@/hooks/useAnalyze";
import { detectLanguage } from "@/lib/languageDetector";

export default function UploadPage() {
  const router = useRouter();
  const { state, dispatch } = useReport();
  const { start } = useAnalyze({ onPaymentRequired: () => router.push("/results") });
  const [contractText, setContractText] = useState<string | null>(null);
  const [isAnalyzing, setAnalyzing] = useState(false);

  // Initialize language from the cascade once the client mounts.
  useEffect(() => {
    dispatch({ type: "SET_LANGUAGE", language: detectLanguage() });
  }, [dispatch]);

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-semibold tracking-tight" style={{ fontSize: "var(--text-hero)" }}>
          Know what you signed.
        </h1>
        <p className="text-muted-foreground text-base">
          Drop your employment contract — we&apos;ll read it clause-by-clause against the real labor
          law of your country.
        </p>
      </header>

      <SessionRestoreBanner />

      <div className="flex flex-wrap items-end gap-4">
        <JurisdictionToggle
          value={state.jurisdiction}
          onChange={(j) => dispatch({ type: "SET_JURISDICTION", jurisdiction: j })}
        />
        <PermitSelector
          jurisdiction={state.jurisdiction}
          value={state.permitType}
          onChange={(p) => dispatch({ type: "SET_PERMIT_TYPE", permitType: p })}
        />
      </div>

      <UploadZone disabled={isAnalyzing} onText={(text) => setContractText(text)} />

      <div className="flex justify-end">
        <Button
          data-testid="analyze-cta"
          disabled={!contractText || isAnalyzing}
          onClick={async () => {
            if (!contractText) return;
            setAnalyzing(true);
            router.push("/analyzing");
            await start(contractText);
            router.push("/results");
          }}
        >
          Analyze contract
        </Button>
      </div>
    </section>
  );
}
