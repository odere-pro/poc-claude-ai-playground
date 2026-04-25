"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { JurisdictionToggle } from "@/components/molecules/JurisdictionToggle";
import { PermitSelector } from "@/components/molecules/PermitSelector";
import { UploadTab } from "@/components/molecules/UploadTab";
import { useReport, useReportDispatch } from "@/context/ReportContext";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

type Tab = "file" | "text" | "speak";

export function UploadZone() {
  const { jurisdiction, permitType } = useReport();
  const dispatch = useReportDispatch();
  const router = useRouter();
  const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";

  const [tab, setTab] = useState<Tab>("file");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File): boolean => {
    if (!ACCEPTED.has(file.type)) {
      setError("We support PDFs and images.");
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("We support files up to 10MB.");
      return false;
    }
    setError(null);
    setFileName(file.name);
    return true;
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) accept(file);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) accept(file);
  };

  const ready = tab === "text" ? text.trim().length > 0 : fileName !== null;

  const onAnalyze = () => {
    const payload = tab === "text" ? text.trim() : (fileName ?? "");
    if (!payload) return;
    dispatch({ type: "SET_CONTRACT_TEXT", payload });
    dispatch({ type: "START_ANALYSIS" });
    router.push("/analyzing");
  };

  return (
    <section
      data-testid="upload-zone"
      className="flex flex-col gap-6 rounded-lg p-6"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <h1
        data-testid="headline"
        className="text-3xl font-semibold tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-hero)",
        }}
      >
        Know your rights.
      </h1>
      <p style={{ color: "var(--color-muted-foreground)" }}>
        Paste your employment contract and we&apos;ll flag every clause that breaks Dutch or Swedish
        labor law.
      </p>

      <div
        role="tablist"
        className="flex gap-2 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <UploadTab mode="file" active={tab === "file"} onSelect={() => setTab("file")} />
        <UploadTab mode="text" active={tab === "text"} onSelect={() => setTab("text")} />
        <UploadTab
          mode="speak"
          active={tab === "speak"}
          onSelect={() => voiceEnabled && setTab("speak")}
          disabled={!voiceEnabled}
        />
      </div>

      {tab === "file" ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Drop a PDF here, or pick a file.
          </p>
          <input
            type="file"
            data-testid="file-input"
            accept=".pdf,image/*"
            onChange={onPick}
            className="text-sm"
          />
          {fileName ? (
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Selected: {fileName}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs" style={{ color: "var(--color-status-illegal)" }}>
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "text" ? (
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the contract text here…"
          className="w-full rounded-md border p-3 text-sm"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
            fontFamily: "var(--font-mono)",
          }}
        />
      ) : null}

      {tab === "speak" ? (
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Press the mic in the bottom right to start dictating.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span
            className="text-xs tracking-wide uppercase"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Jurisdiction
          </span>
          <JurisdictionToggle
            value={jurisdiction}
            onChange={(j) => dispatch({ type: "SET_JURISDICTION", payload: j })}
          />
        </div>
        <PermitSelector
          jurisdiction={jurisdiction}
          value={permitType}
          onChange={(id) => dispatch({ type: "SET_PERMIT_TYPE", payload: id })}
        />
        <Button
          data-testid="analyze-button"
          variant="primary"
          size="lg"
          disabled={!ready}
          onClick={onAnalyze}
        >
          Analyze
        </Button>
      </div>

      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        Your contract is never stored. We send it once for analysis and discard it.
      </p>
    </section>
  );
}
