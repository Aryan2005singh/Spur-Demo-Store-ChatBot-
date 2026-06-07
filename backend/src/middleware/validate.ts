import { type Request, type Response, type NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../types/index.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 1000;

export const sendMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message is required.' })
    .trim()
    .min(1, { message: 'Message cannot be empty.' })
    .max(MAX_MESSAGE_LENGTH, {
      message: `Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
    }),
  sessionId: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

export const sessionIdParamSchema = z.object({
  sessionId: z
    .string({ required_error: 'Session ID is required.' })
    .trim()
    .min(1, { message: 'Session ID cannot be empty.' }),
});

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * validateSendMessage — validates POST /chat/message body.
 * Sanitises and replaces req.body with the parsed, trimmed values.
 */
export function validateSendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    req.body = sendMessageSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => e.message).join(' ');
      next(new AppError(message, 400, 'VALIDATION_ERROR'));
    } else {
      next(err);
    }
  }
}

/**
 * validateSessionIdParam — validates :sessionId route parameter.
 */
export function validateSessionIdParam(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    sessionIdParamSchema.parse(req.params);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => e.message).join(' ');
      next(new AppError(message, 400, 'VALIDATION_ERROR'));
    } else {
      next(err);
    }
  }
}
