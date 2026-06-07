import { type Request, type Response } from 'express';

/**
 * Catches all requests that didn't match any route.
 * Must be registered after all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found.`,
    code: 'NOT_FOUND',
  });
}
