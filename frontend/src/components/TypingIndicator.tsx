/**
 * TypingIndicator — animated "AI is typing…" bubble.
 * Three dots with staggered bounce animation.
 */
export function TypingIndicator(): JSX.Element {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v.01M12 12v.01M12 18v.01"
          />
        </svg>
      </div>

      {/* Bubble */}
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5" aria-label="AI is typing">
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-typing-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-typing-bounce"
            style={{ animationDelay: '160ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-typing-bounce"
            style={{ animationDelay: '320ms' }}
          />
        </div>
      </div>
    </div>
  );
}
