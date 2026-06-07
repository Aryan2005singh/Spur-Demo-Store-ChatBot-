import type { ILLMProvider } from './ILLMProvider.js';
import { GroqProvider } from './groq.provider.js';
import { logger } from '../../utils/logger.js';

/**
 * LLM Factory
 *
 * Reads LLM_PROVIDER from environment and returns a concrete ILLMProvider.
 *
 * Adding a new provider:
 *  1. Create `<name>.provider.ts` implementing ILLMProvider.
 *  2. Import it here and add a case to the switch.
 *  3. Set LLM_PROVIDER=<name> in .env.
 *
 * chat.service.ts never imports a concrete provider — only this factory.
 */
export function createLLMProvider(): ILLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? 'groq').toLowerCase().trim();

  switch (provider) {
    case 'groq': {
      const apiKey = process.env.GROQ_API_KEY ?? '';
      if (!apiKey) {
        throw new Error('LLM factory: GROQ_API_KEY environment variable is not set.');
      }
      logger.info(`[LLMFactory] Initialising provider: Groq`);
      return new GroqProvider(apiKey);
    }

    // ── Future providers ──────────────────────────────────────────────────────
    // case 'openai': {
    //   const apiKey = process.env.OPENAI_API_KEY ?? '';
    //   return new OpenAIProvider(apiKey);
    // }
    // case 'gemini': {
    //   const apiKey = process.env.GEMINI_API_KEY ?? '';
    //   return new GeminiProvider(apiKey);
    // }
    // ─────────────────────────────────────────────────────────────────────────

    default:
      throw new Error(
        `LLM factory: Unknown provider "${provider}". ` +
        `Supported values: groq. Set LLM_PROVIDER in your .env.`,
      );
  }
}
