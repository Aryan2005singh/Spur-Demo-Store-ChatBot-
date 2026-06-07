// ─── Message types ────────────────────────────────────────────────────────────

export type MessageSender = 'user' | 'assistant';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: string; // ISO string from API
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: Message[];
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

// ─── Chat state ───────────────────────────────────────────────────────────────

export interface ChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
}

// ─── UI types ─────────────────────────────────────────────────────────────────

export interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'info';
}
