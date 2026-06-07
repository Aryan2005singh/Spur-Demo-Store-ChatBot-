import Groq from 'groq-sdk';
import type { ILLMProvider } from './ILLMProvider.js';
import type { LLMGenerateOptions, LLMResponse } from '../../types/index.js';
import { AppError } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * GroqProvider — concrete implementation of ILLMProvider using the Groq SDK.
 *
 * Model: llama-3.3-70b-versatile
 *  - Fast, capable, free-tier friendly for demos.
 *  - Swap to "mixtral-8x7b-32768" or any Groq-hosted model via MODEL constant.
 *
 * Error handling:
 *  - 401 / auth errors     → AppError LLM_UNAVAILABLE (config problem)
 *  - 429 rate limit        → AppError LLM_RATE_LIMITED
 *  - timeout               → AppError LLM_UNAVAILABLE
 *  - unexpected response   → AppError LLM_UNAVAILABLE
 */

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 512;
const TEMPERATURE = 0.4;        // Low for factual support replies
const REQUEST_TIMEOUT_MS = 30_000;

export class GroqProvider implements ILLMProvider {
  public readonly providerName = 'Groq';
  private readonly client: Groq;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GroqProvider: GROQ_API_KEY is missing or empty.');
    }
    this.client = new Groq({
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,  // One automatic retry on network blips; we handle 429 ourselves
    });
  }

  async generateReply(options: LLMGenerateOptions): Promise<LLMResponse> {
    const { history, userMessage, systemPrompt } = options;

    // Build the messages array: system + history + new user message
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    logger.debug(`[GroqProvider] Sending ${messages.length} messages to ${MODEL}`);

    try {
      const completion = await this.client.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: false,
      });

      const reply = completion.choices?.[0]?.message?.content;

      if (!reply || typeof reply !== 'string' || reply.trim() === '') {
        logger.warn('[GroqProvider] Received empty or malformed response', { completion });
        throw new AppError(
          'The support assistant returned an empty response. Please try again.',
          502,
          'LLM_UNAVAILABLE',
        );
      }

      logger.debug('[GroqProvider] Reply received', {
        tokens: completion.usage?.total_tokens,
      });

      return { reply: reply.trim() };
    } catch (err: unknown) {
      // Already a typed AppError — re-throw
      if (err instanceof AppError) throw err;

      // Groq SDK errors
      if (err instanceof Groq.APIError) {
        logger.error('[GroqProvider] Groq API error', {
          status: err.status,
          message: err.message,
        });

        if (err.status === 401 || err.status === 403) {
          throw new AppError(
            'The support assistant is temporarily unavailable due to a configuration issue. Please try again later.',
            503,
            'LLM_UNAVAILABLE',
          );
        }

        if (err.status === 429) {
          throw new AppError(
            'The support assistant is receiving too many requests right now. Please wait a moment and try again.',
            429,
            'LLM_RATE_LIMITED',
          );
        }

        if (err.status === 408 || err.message?.toLowerCase().includes('timeout')) {
          throw new AppError(
            'The support assistant took too long to respond. Please try again.',
            504,
            'LLM_UNAVAILABLE',
          );
        }

        // All other Groq API errors
        throw new AppError(
          'Sorry, the support assistant is temporarily unavailable. Please try again later.',
          502,
          'LLM_UNAVAILABLE',
        );
      }

      // Network / timeout errors (non-SDK)
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('timeout') ||
            err.message.toLowerCase().includes('econnrefused') ||
            err.message.toLowerCase().includes('network')) {
          throw new AppError(
            'Unable to reach the support assistant due to a network issue. Please try again.',
            504,
            'LLM_UNAVAILABLE',
          );
        }
      }

      // Unknown error
      logger.error('[GroqProvider] Unexpected error', err);
      throw new AppError(
        'Sorry, the support assistant is temporarily unavailable. Please try again later.',
        502,
        'LLM_UNAVAILABLE',
      );
    }
  }
}
