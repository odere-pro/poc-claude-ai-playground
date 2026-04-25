"use client";

interface UploadTabProps {
  readonly mode: "file" | "text" | "speak";
  readonly active: boolean;
  readonly onSelect: () => void;
  readonly disabled?: boolean;
}

const LABEL: Record<UploadTabProps["mode"], string> = {
  file: "Upload PDF",
  text: "Paste text",
  speak: "Speak",
};

export function UploadTab({ mode, active, onSelect, disabled }: UploadTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      data-testid={mode === "speak" ? "upload-tab-speak" : `upload-tab-${mode}`}
      onClick={onSelect}
      className="rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderBottomColor: active ? "var(--color-primary)" : "transparent",
        color: active ? "var(--color-primary)" : "var(--color-muted-foreground)",
      }}
    >
      {LABEL[mode]}
    </button>
  );
}
