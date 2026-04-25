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

export const MAX_CONTRACT_BYTES = 100 * 1024;

export const analyzeRequestSchema = z.object({
  contractText: z
    .string()
    .min(1)
    .refine((s) => Buffer.byteLength(s, "utf-8") <= MAX_CONTRACT_BYTES, {
      message: "contractText exceeds 100KB",
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
