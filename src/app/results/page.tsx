"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/organisms/AppHeader";
import { ClauseList } from "@/components/organisms/ClauseList";
import { NavigationHighlight } from "@/components/organisms/NavigationHighlight";
import { RightsSummary } from "@/components/organisms/RightsSummary";
import { SummaryBanner } from "@/components/organisms/SummaryBanner";
import { VoiceController } from "@/components/organisms/VoiceController";
import { useReport } from "@/context/ReportContext";

export default function ResultsPage() {
  const { phase, report } = useReport();
  const router = useRouter();

  useEffect(() => {
    if (phase !== "results" || !report?.summary) {
      router.replace("/");
    }
  }, [phase, report?.summary, router]);

  if (phase !== "results" || !report?.summary) {
    return null;
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <SummaryBanner />
        <ClauseList />
        <RightsSummary />
      </main>
      <NavigationHighlight />
      <VoiceController />
    </>
  );
}
