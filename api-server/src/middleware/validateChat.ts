import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000, "Message content cannot exceed 8000 characters"),
});

const ChatRequestSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1, "At least one message is required")
    .max(20, "Cannot send more than 20 messages in a single request"),
});

export function validateChat(req: Request, res: Response, next: NextFunction): void {
  const result = ChatRequestSchema.safeParse(req.body);

  if (!result.success) {
    const error = fromZodError(result.error as any);
    res.status(400).json({ error: error.message });
    return;
  }

  // Attach the validated & typed body back to the request
  req.body = result.data;
  next();
}
