/**
 * EmptyState — shown when there are no messages yet.
 * Displays suggested quick-start questions.
 */

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  'Do you ship worldwide?',
  'What is your return policy?',
  'How long do refunds take?',
  'What are your support hours?',
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* Logo mark */}
      <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-lg">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Hi, I'm the Spur Support Assistant
      </h2>
      <p className="text-gray-500 text-sm max-w-xs mb-8">
        Ask me anything about shipping, returns, refunds, or our store policies.
        I'm here to help 24/7.
      </p>

      {/* Quick suggestions */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Try asking
        </p>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 
                       bg-white hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700
                       transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
