"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateUpload, MAX_UPLOAD_BYTES } from "@/lib/uploadValidation";
import type { UploadValidationFailure } from "@/lib/uploadValidation";

interface UploadZoneProps {
  readonly onText: (text: string) => void;
  readonly disabled?: boolean;
}

const FAILURE_MESSAGES: Record<UploadValidationFailure, string> = {
  empty: "File appears to be empty.",
  too_large: `File exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`,
  mime_not_allowed: "Only PDF, JPEG, and PNG are accepted.",
  magic_mismatch: "File contents don't match its extension.",
};

async function readHead(file: File, n = 16): Promise<Uint8Array> {
  const slice = file.slice(0, n);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

async function extractText(file: File): Promise<string> {
  if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    return await file.text();
  }
  // PDF / image text extraction is server-side later — for now, return a
  // placeholder so the API layer can still validate the request shape.
  return `[binary upload: ${file.size} bytes — extraction pending]`;
}

export function UploadZone({ onText, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const head = await readHead(file);
      const result = validateUpload({
        declaredMime: file.type,
        sizeBytes: file.size,
        head,
      });
      if (!result.ok) {
        setError(FAILURE_MESSAGES[result.reason]);
        return;
      }
      setFilename(file.name);
      const text = await extractText(file);
      onText(text);
    },
    [onText],
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="upload-zone"
        data-dragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className="border-border flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors data-[dragging=true]:border-[var(--color-status-illegal)] data-[dragging=true]:bg-[var(--color-status-illegal-bg)]"
      >
        <p className="text-base font-medium">Drop your contract here</p>
        <p className="text-muted-foreground text-sm">PDF · JPEG · PNG · TXT — up to 10MB</p>
        {filename && (
          <p
            data-testid="upload-filename"
            role="status"
            aria-live="polite"
            className="font-mono text-sm opacity-70"
          >
            ✓ {filename}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          aria-label="Upload contract file"
          accept="application/pdf,image/jpeg,image/png,text/plain"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {/* Clickable, focusable, keyboard-operable trigger. Removing the
            div-level onClick fixes WCAG 2.1.1 — the drop zone is now
            mouse/drag-only with this button as the keyboard alternative. */}
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" data-testid="upload-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
