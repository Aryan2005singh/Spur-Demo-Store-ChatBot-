import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Global error handler — must be registered LAST in Express middleware chain.
 *
 * Guarantees:
 *  - No stack traces ever reach the client
 *  - All errors return a consistent { error, code } JSON shape
 *  - Operational errors (AppError) get their own status code
 *  - Unexpected errors → 500 with a generic safe message
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    // Operational, expected error — log at warn level
    logger.warn('[ErrorHandler] Operational error', {
      code: err.code,
      status: err.statusCode,
      message: err.message,
      path: req.path,
    });

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Unexpected error — log at error level, return safe generic message
  logger.error('[ErrorHandler] Unexpected error', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
  });
}
