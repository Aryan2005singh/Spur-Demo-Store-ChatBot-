import type { LLMGenerateOptions, LLMResponse } from '../../types/index.js';

/**
 * ILLMProvider — the single interface every LLM provider must implement.
 *
 * To add a new provider (OpenAI, Gemini, xAI…):
 *  1. Create `<name>.provider.ts` implementing this interface.
 *  2. Register it in `llm.factory.ts`.
 *  3. Set LLM_PROVIDER=<name> in your .env.
 *
 * chat.service.ts depends only on this interface — zero changes needed there.
 */
export interface ILLMProvider {
  /**
   * Generate an AI reply given conversation history and a new user message.
   * Must never throw directly — handle errors internally and return a
   * user-friendly fallback string, OR re-throw a typed AppError.
   */
  generateReply(options: LLMGenerateOptions): Promise<LLMResponse>;

  /** Human-readable name of this provider, used in logs. */
  readonly providerName: string;
}
