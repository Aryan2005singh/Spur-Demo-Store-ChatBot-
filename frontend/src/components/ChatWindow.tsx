import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble.js';
import { TypingIndicator } from './TypingIndicator.js';
import { EmptyState } from './EmptyState.js';
import type { Message } from '../types/index.js';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  onSuggestionClick: (text: string) => void;
}

/**
 * ChatWindow
 *
 * Scrollable container for all messages.
 * Auto-scrolls to bottom whenever messages or loading state changes.
 */
export function ChatWindow({
  messages,
  isLoading,
  isLoadingHistory,
  onSuggestionClick,
}: ChatWindowProps): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  // ── Loading history skeleton ──────────────────────────────────────────────
  if (isLoadingHistory) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" aria-label="Loading conversation history">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div
              className="rounded-2xl bg-gray-200 animate-pulse"
              style={{
                height: 40 + (i * 8),
                width: `${40 + (i * 15)}%`,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyState onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  // ── Message list ──────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing indicator */}
      {isLoading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} aria-hidden="true" className="h-1" />
    </div>
  );
}
