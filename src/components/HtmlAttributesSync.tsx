"use client";

import { useEffect } from "react";
import { useReport } from "@/context/ReportContext";

// Keeps `<html lang>` and `<html data-jurisdiction>` in sync with the
// reducer state. Mounted once inside ReportProvider; renders nothing.
export function HtmlAttributesSync() {
  const { detectedLanguage, jurisdiction } = useReport();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = detectedLanguage;
    document.documentElement.setAttribute("data-jurisdiction", jurisdiction);
  }, [detectedLanguage, jurisdiction]);

  return null;
}
