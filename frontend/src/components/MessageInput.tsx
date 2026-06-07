import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  isLoading: boolean;
  maxLength: number;
}

/**
 * MessageInput
 *
 * Features:
 *  - Auto-expanding textarea
 *  - Enter to send, Shift+Enter for newline
 *  - Character counter (warning at 80% of max)
 *  - Disabled state while AI is responding
 *  - Client-side trim/empty validation
 */
export function MessageInput({ onSend, isLoading, maxLength }: MessageInputProps): JSX.Element {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const isOverLimit = charCount > maxLength;
  const isEmpty = text.trim().length === 0;
  const canSend = !isEmpty && !isOverLimit && !isLoading;
  const showCounter = charCount > maxLength * 0.7;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      adjustHeight();
    },
    [adjustHeight],
  );

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const message = text.trim();
    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(message);
    textareaRef.current?.focus();
  }, [canSend, text, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div
        className={`flex items-end gap-3 rounded-xl border transition-all duration-150 bg-gray-50
          ${isOverLimit
            ? 'border-red-400 ring-1 ring-red-300'
            : 'border-gray-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 focus-within:bg-white'
          }`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about shipping, returns, refunds…"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-gray-800 
                     placeholder-gray-400 focus:outline-none disabled:opacity-60
                     min-h-[44px] max-h-[160px] leading-relaxed"
          aria-label="Type your message"
          aria-describedby={showCounter ? 'char-counter' : undefined}
        />

        <div className="flex items-center gap-2 pr-2 pb-2 flex-shrink-0">
          {/* Character counter */}
          {showCounter && (
            <span
              id="char-counter"
              className={`text-xs tabular-nums select-none ${
                isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'
              }`}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}

          {/* Send button */}
          <button
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-label="Send message"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
              ${canSend
                ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              // Spinner
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              // Send arrow
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
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-1.5 text-[11px] text-gray-400 text-center select-none">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
