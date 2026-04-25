"use client";

import { useEffect } from "react";
import { useReport, useReportDispatch } from "@/context/ReportContext";

const HIGHLIGHT_DURATION_MS = 3000;

export function NavigationHighlight() {
  const { highlightedClauseId } = useReport();
  const dispatch = useReportDispatch();

  useEffect(() => {
    if (!highlightedClauseId) return;
    const node = document.querySelector(
      `[data-testid="clause-card"][data-id="${highlightedClauseId}"]`,
    );
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => {
      dispatch({ type: "HIGHLIGHT_CLAUSE", payload: null });
    }, HIGHLIGHT_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [highlightedClauseId, dispatch]);

  return null;
}
