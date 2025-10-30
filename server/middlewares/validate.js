import { z } from "zod";

export const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .min(1),
  options: z
    .object({
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().positive().optional(),
    })
    .optional(),
});

export function validateChatBody(req, res, next) {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: parsed.error.issues });
  }
  req.validated = parsed.data;
  next();
}
