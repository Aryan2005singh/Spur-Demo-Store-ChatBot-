import { useCallback } from 'react';
import { ChatWindow } from '../components/ChatWindow.js';
import { MessageInput } from '../components/MessageInput.js';
import { useChat } from '../hooks/useChat.js';

/**
 * ChatPage
 *
 * Full-page SaaS chat layout:
 *  ┌─────────────────────────────┐
 *  │  Header (brand + status)    │
 *  ├─────────────────────────────┤
 *  │  ChatWindow (scrollable)    │
 *  │   ↕ flex-1, overflow-auto  │
 *  ├─────────────────────────────┤
 *  │  MessageInput (fixed bottom)│
 *  └─────────────────────────────┘
 */
export function ChatPage(): JSX.Element {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    sendUserMessage,
    MAX_MESSAGE_LENGTH,
  } = useChat();

  const handleSuggestionClick = useCallback(
    (text: string) => {
      void sendUserMessage(text);
    },
    [sendUserMessage],
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Outer wrapper centres the chat widget on large screens ── */}
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto h-full">

        {/* ── Header ── */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          {/* Brand avatar */}
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm select-none">S</span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 leading-tight truncate">
              Spur Demo Store
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-gray-500">
                {isLoading ? 'AI is typing…' : 'Support Assistant · Online'}
              </span>
            </div>
          </div>

          {/* Optional: info / help icon */}
          <button
            aria-label="Support information"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </button>
        </header>

        {/* ── Chat window (grows to fill space) ── */}
        <main className="flex flex-col flex-1 min-h-0 bg-white">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            isLoadingHistory={isLoadingHistory}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* ── Input ── */}
          <MessageInput
            onSend={sendUserMessage}
            isLoading={isLoading}
            maxLength={MAX_MESSAGE_LENGTH}
          />
        </main>
      </div>
    </div>
  );
}
