import { describe, it, expect } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  detectMimeFromMagicBytes,
  validateUpload,
} from "./uploadValidation";

const pdfMagic = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"
const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

describe("detectMimeFromMagicBytes", () => {
  it("detects PDF", () => {
    expect(detectMimeFromMagicBytes(pdfMagic)).toBe("application/pdf");
  });

  it("detects JPEG", () => {
    expect(detectMimeFromMagicBytes(jpegMagic)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    expect(detectMimeFromMagicBytes(pngMagic)).toBe("image/png");
  });

  it("returns null for unknown magic bytes", () => {
    expect(detectMimeFromMagicBytes(garbage)).toBeNull();
  });

  it("returns null for buffers shorter than the longest signature", () => {
    expect(detectMimeFromMagicBytes(new Uint8Array([0x25]))).toBeNull();
  });
});

describe("validateUpload", () => {
  const validPdf = {
    declaredMime: "application/pdf",
    sizeBytes: 1024,
    head: pdfMagic,
  };

  it("accepts a well-formed PDF", () => {
    expect(validateUpload(validPdf)).toEqual({ ok: true });
  });

  it("accepts JPEG and PNG images", () => {
    expect(
      validateUpload({
        declaredMime: "image/jpeg",
        sizeBytes: 1024,
        head: jpegMagic,
      }).ok,
    ).toBe(true);
    expect(
      validateUpload({
        declaredMime: "image/png",
        sizeBytes: 1024,
        head: pngMagic,
      }).ok,
    ).toBe(true);
  });

  it("rejects disallowed MIME types", () => {
    const result = validateUpload({
      declaredMime: "application/x-msdownload",
      sizeBytes: 1024,
      head: garbage,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("mime_not_allowed");
  });

  it("rejects empty uploads", () => {
    const result = validateUpload({
      declaredMime: "application/pdf",
      sizeBytes: 0,
      head: pdfMagic,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("empty");
  });

  it("rejects uploads above the size cap", () => {
    const result = validateUpload({
      declaredMime: "application/pdf",
      sizeBytes: MAX_UPLOAD_BYTES + 1,
      head: pdfMagic,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("too_large");
  });

  it("rejects mismatched magic bytes vs declared MIME", () => {
    const result = validateUpload({
      declaredMime: "application/pdf",
      sizeBytes: 1024,
      head: jpegMagic,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("magic_mismatch");
  });

  it("rejects unrecognized magic bytes", () => {
    const result = validateUpload({
      declaredMime: "application/pdf",
      sizeBytes: 1024,
      head: garbage,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("magic_mismatch");
  });

  it("exposes the allowlist as readonly", () => {
    expect(ALLOWED_MIME_TYPES).toContain("application/pdf");
    expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES).toContain("image/png");
  });
});
