import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReportProvider } from "@/context/ReportContext";
import { UploadZone } from "./UploadZone";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const original = process.env.NEXT_PUBLIC_VOICE_ENABLED;

afterEach(() => {
  process.env.NEXT_PUBLIC_VOICE_ENABLED = original;
});

function renderUploadZone(voice: "true" | "false") {
  process.env.NEXT_PUBLIC_VOICE_ENABLED = voice;
  render(
    <ReportProvider>
      <UploadZone />
    </ReportProvider>,
  );
}

function makeFile(name: string, type: string, size = 1024): File {
  return new File(["x".repeat(size)], name, { type });
}

describe("UploadZone", () => {
  it("enables Analyze when a valid PDF is selected", async () => {
    renderUploadZone("false");
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = makeFile("contract.pdf", "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByTestId("analyze-button")).not.toBeDisabled());
  });

  it("rejects non-PDF/image files with an inline error", () => {
    renderUploadZone("false");
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile("x.bmp", "image/bmp")] },
    });
    expect(screen.getByText(/PDFs and images/i)).toBeInTheDocument();
  });

  it("rejects files over 10MB", () => {
    renderUploadZone("false");
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const big = makeFile("huge.pdf", "application/pdf", 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [big] } });
    expect(screen.getByText(/10MB/i)).toBeInTheDocument();
  });

  it("disables the Speak tab when NEXT_PUBLIC_VOICE_ENABLED !== 'true'", () => {
    renderUploadZone("false");
    expect(screen.getByTestId("upload-tab-speak")).toBeDisabled();
  });

  it("enables the Speak tab when NEXT_PUBLIC_VOICE_ENABLED === 'true'", () => {
    renderUploadZone("true");
    expect(screen.getByTestId("upload-tab-speak")).not.toBeDisabled();
  });
});
