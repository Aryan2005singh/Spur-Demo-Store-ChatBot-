import { type Request, type Response, type NextFunction } from 'express';
import type { ChatService } from '../services/chat.service.js';
import type { SendMessageRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * ChatController
 *
 * Thin layer between Express routes and ChatService.
 * Responsibilities:
 *  - Extract validated data from req
 *  - Call the appropriate service method
 *  - Send the HTTP response
 *  - Pass any errors to next() for the global error handler
 *
 * No business logic lives here.
 */
export class ChatController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  /**
   * POST /chat/message
   * Body: { message: string; sessionId?: string }
   */
  sendMessage = async (
    req: Request<object, object, SendMessageRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { message, sessionId } = req.body;

      logger.info('[ChatController] POST /chat/message', {
        sessionId: sessionId ?? 'new',
        messageLength: message.length,
      });

      const result = await this.chatService.handleMessage(message, sessionId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /chat/history/:sessionId
   */
  getHistory = async (
    req: Request<{ sessionId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { sessionId } = req.params;

      logger.info('[ChatController] GET /chat/history', { sessionId });

      const result = await this.chatService.getHistory(sessionId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
