import { z } from "zod";

// Runtime validation at every system boundary: dynamic ruleset/permit
// JSON imports, and untrusted JSON parsed from the model's response.

const jurisdictionSchema = z.enum(["nl", "se"]);

const citationSchema = z.object({
  article: z.string().min(1),
  law: z.string().min(1),
  description: z.string(),
  source: z.string().min(1),
});

const ruleSchema = z.object({
  id: z.string().min(1),
  clauseType: z.string().min(1),
  article: z.string().min(1),
  law: z.string().min(1),
  description: z.string().min(1),
  conditions: z.array(z.string()).optional(),
  illegalIf: z.array(z.string()).optional(),
  exploitativeIf: z.array(z.string()).optional(),
  source: z.string().min(1),
});

export const rulesetSchema = z.object({
  jurisdiction: jurisdictionSchema,
  source: z.string().min(1),
  rules: z.array(ruleSchema).min(1),
});

export const permitConditionsSchema = z.object({
  maxHoursPerWeek: z.number().nullable(),
  sectorRestrictions: z.string(),
  locationRestrictions: z.string(),
  salaryMinimum: z.string(),
});

export const permitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  authority: z.string().min(1),
  conditions: permitConditionsSchema,
  source: z.string().min(1),
});

export const permitCategoriesSchema = z.object({
  jurisdiction: jurisdictionSchema,
  source: z.string().min(1),
  permits: z.array(permitSchema).min(1),
});

const voiceIntentSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("read_flags") }),
  z.object({ intent: z.literal("explain_clause"), clauseId: z.string().min(1) }),
  z.object({ intent: z.literal("read_rights") }),
  z.object({ intent: z.literal("navigate_next") }),
  z.object({ intent: z.literal("navigate_prev") }),
  z.object({ intent: z.literal("navigate_to"), topic: z.string().min(1) }),
  z.object({ intent: z.literal("repeat") }),
  z.object({ intent: z.literal("what_can_i_do") }),
  z.object({ intent: z.literal("download") }),
  z.object({ intent: z.literal("new_contract") }),
  z.object({
    intent: z.literal("switch_jurisdiction"),
    jurisdiction: jurisdictionSchema,
  }),
  z.object({ intent: z.literal("unknown") }),
]);

export const voiceCommandResponseSchema = z.object({
  intent: voiceIntentSchema,
  responseText: z.string(),
  language: z.string().min(1),
});

// Re-export the citation schema in case future surfaces need it.
export { citationSchema, ruleSchema };
