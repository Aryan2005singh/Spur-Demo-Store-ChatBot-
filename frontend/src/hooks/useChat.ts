import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { sendMessage, getHistory, extractErrorMessage } from '../services/api.js';
import { useLocalStorage } from './useLocalStorage.js';
import type { Message, ChatState } from '../types/index.js';

const SESSION_STORAGE_KEY = 'spur_chat_session_id';
const MAX_MESSAGE_LENGTH = 1000;

/**
 * useChat
 *
 * Central hook managing all chat state and side effects:
 *  - sessionId (persisted in localStorage)
 *  - Message list
 *  - Loading / typing indicator states
 *  - History restoration on mount
 *  - Send message with full error handling
 */
export function useChat(): ChatState & {
  sendUserMessage: (text: string) => Promise<void>;
  clearError: () => void;
  MAX_MESSAGE_LENGTH: number;
} {
  const [sessionId, setSessionId] = useLocalStorage<string | null>(
    SESSION_STORAGE_KEY,
    null,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate history loads on StrictMode double-invocation
  const historyLoaded = useRef(false);

  // ── Restore history on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || historyLoaded.current) return;

    historyLoaded.current = true;
    setIsLoadingHistory(true);

    getHistory(sessionId)
      .then((data) => {
        if (data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch((err: unknown) => {
        // History load failure is non-fatal — start fresh
        const msg = extractErrorMessage(err);
        console.warn('Could not restore chat history:', msg);
        // If session not found, clear the stored sessionId so next message starts fresh
        if (msg.includes('No conversation found') || msg.includes('404')) {
          setSessionId(null);
        }
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [sessionId, setSessionId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendUserMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();

      // Client-side validation (mirrors backend)
      if (!trimmed) return;
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        toast.error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
        return;
      }

      // Optimistically add user message to UI
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage(trimmed, sessionId);

        // Store sessionId from response (first message creates it)
        if (response.sessionId && response.sessionId !== sessionId) {
          setSessionId(response.sessionId);
        }

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: response.reply,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);

        // Show toast notification
        toast.error(errorMessage, {
          duration: 5000,
          id: 'chat-error',
        });

        setError(errorMessage);

        // Remove the optimistically added user message on failure
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, setSessionId],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    sessionId,
    isLoading,
    isLoadingHistory,
    error,
    sendUserMessage,
    clearError,
    MAX_MESSAGE_LENGTH,
  };
}
