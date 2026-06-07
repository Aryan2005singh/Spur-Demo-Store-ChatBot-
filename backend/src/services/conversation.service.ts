import { PrismaClient, type Prisma } from '@prisma/client';
import type { ChatMessage, LLMMessage, SenderRole } from '../types/index.js';
import { AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * ConversationService
 *
 * All database interactions for conversations and messages.
 * Uses a shared PrismaClient instance (singleton pattern).
 *
 * Responsibilities:
 *  - Create or retrieve conversation sessions
 *  - Persist user and AI messages
 *  - Retrieve last N messages for LLM context
 *  - Retrieve full history for the history endpoint
 */

// Singleton Prisma client — prevents connection pool exhaustion
let _prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    });
  }
  return _prisma;
}

// Maximum messages retrieved for LLM context window
const CONTEXT_WINDOW_SIZE = 10;

export class ConversationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  /**
   * Returns an existing conversation by ID, or creates a new one.
   * Throws SESSION_NOT_FOUND if sessionId is provided but doesn't exist.
   */
  async getOrCreateConversation(sessionId?: string): Promise<string> {
    try {
      if (sessionId && sessionId.trim() !== '') {
        const existing = await this.prisma.conversation.findUnique({
          where: { id: sessionId },
          select: { id: true },
        });

        if (!existing) {
          // Provided sessionId doesn't exist — treat as invalid, start fresh
          logger.warn('[ConversationService] Unknown sessionId, starting new conversation', { sessionId });
          // We intentionally fall through to create a new conversation
          // rather than hard-erroring — better UX for edge cases
        } else {
          return existing.id;
        }
      }

      // Create a new conversation
      const conversation = await this.prisma.conversation.create({
        data: {},
        select: { id: true },
      });

      logger.info('[ConversationService] New conversation created', { id: conversation.id });
      return conversation.id;
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      logger.error('[ConversationService] Failed to get/create conversation', err);
      throw new AppError(
        'Unable to start a support session. Please refresh and try again.',
        503,
        'DB_ERROR',
      );
    }
  }

  /**
   * Persists a single message to the database.
   */
  async saveMessage(
    conversationId: string,
    sender: SenderRole,
    text: string,
  ): Promise<ChatMessage> {
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          sender,
          text,
        },
      });

      return {
        id: message.id,
        conversationId: message.conversationId,
        sender: message.sender as SenderRole,
        text: message.text,
        createdAt: message.createdAt,
      };
    } catch (err: unknown) {
      logger.error('[ConversationService] Failed to save message', { conversationId, sender, err });
      throw new AppError(
        'Unable to save your message. Please try again.',
        503,
        'DB_ERROR',
      );
    }
  }

  /**
   * Returns the last CONTEXT_WINDOW_SIZE messages formatted for the LLM.
   * Ordered chronologically (oldest first).
   */
  async getRecentHistory(conversationId: string): Promise<LLMMessage[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: CONTEXT_WINDOW_SIZE,
        select: { sender: true, text: true },
      });

      // Reverse so oldest message comes first (correct LLM context order)
      return messages.reverse().map((m) => ({
        role: m.sender as 'user' | 'assistant',
        content: m.text,
      }));
    } catch (err: unknown) {
      logger.error('[ConversationService] Failed to fetch history', { conversationId, err });
      // Non-fatal — we can still attempt a reply without history
      logger.warn('[ConversationService] Falling back to empty history');
      return [];
    }
  }

  /**
   * Returns the full message history for a conversation (for the GET endpoint).
   */
  async getFullHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      // Verify conversation exists
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true },
      });

      if (!conversation) {
        throw new AppError(
          `No conversation found with session ID "${conversationId}".`,
          404,
          'SESSION_NOT_FOUND',
        );
      }

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender as SenderRole,
        text: m.text,
        createdAt: m.createdAt,
      }));
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      logger.error('[ConversationService] Failed to fetch full history', { conversationId, err });
      throw new AppError(
        'Unable to retrieve conversation history.',
        503,
        'DB_ERROR',
      );
    }
  }

  /**
   * Gracefully disconnect Prisma on server shutdown.
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
