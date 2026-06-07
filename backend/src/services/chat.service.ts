import type { ILLMProvider } from './llm/ILLMProvider.js';
import { ConversationService } from './conversation.service.js';
import { buildSystemPrompt } from './llm/knowledgeBase.js';
import type { SendMessageResponse, HistoryResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * ChatService
 *
 * Orchestrates the complete message handling flow:
 *  1. Resolve or create conversation session
 *  2. Persist the user message
 *  3. Fetch recent history for LLM context
 *  4. Call the LLM provider via the abstraction interface
 *  5. Persist the AI reply
 *  6. Return the reply and sessionId to the controller
 *
 * ChatService depends only on ILLMProvider — never on a concrete provider.
 */
export class ChatService {
  private llmProvider: ILLMProvider;
  private conversationService: ConversationService;
  private systemPrompt: string;

  constructor(llmProvider: ILLMProvider) {
    this.llmProvider = llmProvider;
    this.conversationService = new ConversationService();
    // Build once at startup — avoids rebuilding on every request
    this.systemPrompt = buildSystemPrompt();
    logger.info(`[ChatService] Initialised with provider: ${llmProvider.providerName}`);
  }

  async handleMessage(
    userMessage: string,
    sessionId?: string,
  ): Promise<SendMessageResponse> {
    // 1. Resolve conversation (create if needed)
    const conversationId = await this.conversationService.getOrCreateConversation(sessionId);

    // 2. Persist user message
    await this.conversationService.saveMessage(conversationId, 'user', userMessage);

    // 3. Fetch context history (last 10 messages, EXCLUDING the one we just saved —
    //    we pass userMessage separately so the provider can place it correctly)
    const history = await this.conversationService.getRecentHistory(conversationId);

    // Remove the last item if it's the user message we just saved
    // (getRecentHistory fetches from DB which now includes our new message)
    const historyWithoutCurrentMessage = history.filter(
      (_, idx) => !(idx === history.length - 1 && history[history.length - 1]?.role === 'user'),
    );

    logger.info('[ChatService] Sending to LLM', {
      conversationId,
      historyLength: historyWithoutCurrentMessage.length,
      provider: this.llmProvider.providerName,
    });

    // 4. Call LLM
    const { reply } = await this.llmProvider.generateReply({
      history: historyWithoutCurrentMessage,
      userMessage,
      systemPrompt: this.systemPrompt,
    });

    // 5. Persist AI reply
    await this.conversationService.saveMessage(conversationId, 'assistant', reply);

    logger.info('[ChatService] Reply persisted', { conversationId });

    return {
      reply,
      sessionId: conversationId,
    };
  }

  async getHistory(sessionId: string): Promise<HistoryResponse> {
    const messages = await this.conversationService.getFullHistory(sessionId);
    return { sessionId, messages };
  }
}
