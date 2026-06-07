// ─── Domain types ───────────────────────────────────────────────────────────

export type SenderRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: SenderRole;
  text: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  messages: ChatMessage[];
}

// ─── API Request / Response shapes ──────────────────────────────────────────

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
}

// ─── LLM abstraction types ───────────────────────────────────────────────────

/**
 * A single turn in a conversation, shaped for LLM context windows.
 * 'role' uses OpenAI/Groq-compatible naming ('user' | 'assistant').
 */
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  /** The full conversation history to provide as context */
  history: LLMMessage[];
  /** The new user message to respond to */
  userMessage: string;
  /** System prompt injected before all messages */
  systemPrompt: string;
}

export interface LLMResponse {
  reply: string;
}

// ─── Error types ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'LLM_UNAVAILABLE'
  | 'LLM_RATE_LIMITED'
  | 'DB_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: AppErrorCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
