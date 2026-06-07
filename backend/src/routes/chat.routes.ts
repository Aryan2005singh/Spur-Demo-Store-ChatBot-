import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { validateSendMessage, validateSessionIdParam } from '../middleware/validate.js';
import type { ChatService } from '../services/chat.service.js';

/**
 * Chat routes
 *
 * POST /chat/message      — Send a user message, receive AI reply
 * GET  /chat/history/:id  — Retrieve full conversation history
 */
export function createChatRouter(chatService: ChatService): Router {
  const router = Router();
  const controller = new ChatController(chatService);

  router.post('/message', validateSendMessage, controller.sendMessage);
  router.get('/history/:sessionId', validateSessionIdParam, controller.getHistory);

  return router;
}
