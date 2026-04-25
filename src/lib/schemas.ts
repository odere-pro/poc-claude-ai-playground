import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "./types";

export const jurisdictionSchema = z.enum(["nl", "se"]);

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

export const clauseStatusSchema = z.enum([
  "illegal",
  "exploitative",
  "compliant",
  "permit_conflict",
  "unchecked",
]);

export const riskLevelSchema = z.enum(["red", "amber", "green"]);

export const riskMappingSchema = z.object({
  risk: riskLevelSchema,
  path: z.string().min(1),
  category: z.string().min(1),
});

export const citationSchema = z.object({
  article: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
});

export const permitConflictSchema = z.object({
  permitType: z.string().min(1),
  reason: z.string().min(1),
});

export const rightsItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  citation: citationSchema.nullable(),
  contact: z
    .object({
      name: z.string().min(1),
      url: z.string().url().optional(),
      phone: z.string().min(1).optional(),
    })
    .optional(),
});

export const ruleSchema = z.object({
  id: z.string().min(1),
  article: z.string().min(1),
  label: z.string().min(1),
  category: z.string().min(1).optional(),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)),
});

export const permitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  default: z.boolean().optional(),
  forbiddenClauseTags: z.array(z.string().min(1)),
});

export const rulesetSchema = z.object({
  jurisdiction: jurisdictionSchema,
  source: z.string().min(1),
  rules: z.array(ruleSchema).min(1),
});

export const permitCatalogSchema = z.object({
  jurisdiction: jurisdictionSchema,
  permits: z.array(permitSchema).min(1),
});

export const rightsSummarySchema = z.object({
  jurisdiction: jurisdictionSchema,
  union: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    phone: z.string().min(1).optional(),
  }),
  rights: z.array(rightsItemSchema).min(1),
});

export const clauseEventSchema = z.object({
  type: z.literal("clause"),
  id: z.string().min(1),
  title: z.string().min(1),
  status: clauseStatusSchema,
  originalText: z.string(),
  explanation: z.string(),
  citation: citationSchema.nullable(),
  action: z.string().nullable(),
  permitConflict: permitConflictSchema.nullable(),
  riskMappings: z.array(riskMappingSchema).optional().default([]),
});

export const summaryEventSchema = z.object({
  type: z.literal("summary"),
  jurisdiction: jurisdictionSchema,
  permitType: z.string().min(1),
  detectedLanguage: supportedLanguageSchema,
  totalClauses: z.number().int().nonnegative(),
  illegalCount: z.number().int().nonnegative(),
  exploitativeCount: z.number().int().nonnegative(),
  permitConflictCount: z.number().int().nonnegative(),
  uncheckedCount: z.number().int().nonnegative(),
  compliantCount: z.number().int().nonnegative(),
  rights: z.array(rightsItemSchema),
});

// Bumped from 100 KB to 500 KB to accommodate OCR'd multi-page contracts.
export const MAX_CONTRACT_BYTES = 500 * 1024;

// TextEncoder is available in Node 18+ and every browser — use it instead
// of Buffer.byteLength so this schema file is safe to import client-side.
const utf8ByteLength = (s: string): number => new TextEncoder().encode(s).byteLength;

export const analyzeRequestSchema = z.object({
  contractText: z
    .string()
    .min(1)
    .refine((s) => utf8ByteLength(s) <= MAX_CONTRACT_BYTES, {
      message: "contractText exceeds 500KB",
    }),
  permitType: z.string().min(1),
  jurisdiction: jurisdictionSchema,
  detectedLanguage: supportedLanguageSchema,
  customerId: z.string().min(1).optional(),
});
export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;

export const voiceReportContextSchema = z.object({
  currentClauseId: z.string().nullable(),
  clauseIds: z.array(z.string().min(1)),
  jurisdiction: jurisdictionSchema,
});

export const voiceCommandRequestSchema = z.object({
  transcript: z.string().min(1).max(2000),
  reportContext: voiceReportContextSchema,
});
export type VoiceCommandRequestInput = z.infer<typeof voiceCommandRequestSchema>;

// Validated when hydrating from localStorage. A corrupted or
// version-skewed blob fails parse and is cleared rather than
// dispatched into the reducer.
export const savedSummarySchema = z.object({
  summary: summaryEventSchema,
  jurisdiction: jurisdictionSchema,
  permitType: z.string().min(1),
  detectedLanguage: supportedLanguageSchema,
  savedAt: z.number().int().nonnegative(),
});
export type SavedSummaryInput = z.infer<typeof savedSummarySchema>;

// --- OCR ---

export const ocrResponseSchema = z.object({
  text: z.string().min(1),
  pages: z.number().int().positive(),
  detectedLanguage: supportedLanguageSchema.optional(),
  durationMs: z.number().nonnegative(),
});
export type OcrResponse = z.infer<typeof ocrResponseSchema>;

// --- Contract classification + risk pipeline ---

export const mandatoryClauseSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
});

export const redFlagClauseSchema = z.object({
  id: z.string().min(1),
  severity: z.string().min(1),
  riskLevel: riskLevelSchema,
  category: z.string().min(1),
  heading: z.string().min(1),
  plain_english: z.string().min(1),
  action: z.string().min(1),
});

export const contractTypeSpecSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  jurisdiction: jurisdictionSchema,
  applicable_rule_ids: z.array(z.string().min(1)),
  mandatory_clauses: z.array(mandatoryClauseSchema),
  red_flag_ids: z.array(z.string()),
});

export const contractTypeEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  jurisdiction: jurisdictionSchema,
  files: z.array(z.string().min(1)),
});

export const loadedRuleSetSchema = z.object({
  contractType: z.string().min(1),
  contractTypeTitle: z.string().min(1),
  applicableRules: z.array(ruleSchema),
  mandatoryClauses: z.array(mandatoryClauseSchema),
  redFlags: z.array(redFlagClauseSchema),
  rights: z.array(rightsItemSchema),
});

export const classifyResponseSchema = z.object({
  typeId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  jurisdiction: jurisdictionSchema,
});
export type ClassifyResponse = z.infer<typeof classifyResponseSchema>;

export const pipelineRequestSchema = z.object({
  text: z
    .string()
    .min(1)
    .refine((s) => new TextEncoder().encode(s).byteLength <= MAX_CONTRACT_BYTES, {
      message: "text exceeds 500KB",
    }),
  contractType: z.string().min(1).optional(),
  jurisdiction: jurisdictionSchema.optional(),
});
export type PipelineRequestInput = z.infer<typeof pipelineRequestSchema>;

export const rulesQuerySchema = z.object({
  type: z.string().min(1),
  jurisdiction: jurisdictionSchema,
});

// --- Transcription (Reson8) ---

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

export const transcribeContextSchema = z.object({
  jurisdiction: jurisdictionSchema,
  permitType: z.string().min(1),
  detectedLanguage: supportedLanguageSchema,
  /** Legal vocabulary hints extracted from active clause analysis. */
  vocabulary: z.array(z.string().min(1)).max(200).default([]),
  /** Short domain prompt to prime the STT model. */
  prompt: z.string().max(500).default(""),
});
export type TranscribeContext = z.infer<typeof transcribeContextSchema>;

export const transcribeResponseSchema = z.object({
  transcript: z.string(),
  durationMs: z.number().nonnegative(),
});
export type TranscribeResponse = z.infer<typeof transcribeResponseSchema>;
