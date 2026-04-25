import { z } from "zod";

export const PermitTypeSchema = z.string().min(1);
export const DocumentTypeSchema = z.string().min(1);

export const ExtractRequestSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().positive(),
        contentBase64: z.string().min(1),
      }),
    )
    .min(1)
    .max(10),
  permitType: PermitTypeSchema.optional(),
});

export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ExtractedDocumentSchema = z.object({
  type: DocumentTypeSchema,
  fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  confidence: z.number().min(0).max(1),
});

export const MatchRequestSchema = z.object({
  documents: z.array(ExtractedDocumentSchema).min(1),
  permitType: PermitTypeSchema,
  banks: z.array(z.string().min(1)).optional(),
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;
