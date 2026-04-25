interface VoiceTranscriptPreviewProps {
  readonly text: string;
  readonly language: string;
  readonly isLive: boolean;
}

export function VoiceTranscriptPreview({ text, language, isLive }: VoiceTranscriptPreviewProps) {
  return (
    <div
      lang={language}
      className="rounded-md px-3 py-2 text-sm"
      style={{
        backgroundColor: "var(--color-bg-inset)",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {text}
      {isLive ? (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-3 w-0.5 align-middle"
          style={{
            backgroundColor: "var(--color-primary)",
            animation: "cgCaret 1s steps(2, start) infinite",
          }}
        />
      ) : null}
      <style>{`
        @keyframes cgCaret {
          to { visibility: hidden; }
        }
      `}</style>
    </div>
  );
}
