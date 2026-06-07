import type { Message } from '../types/index.js';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * MessageBubble — renders a single chat message.
 * User messages: right-aligned, brand colour.
 * Assistant messages: left-aligned, white with subtle border.
 */
export function MessageBubble({ message }: MessageBubbleProps): JSX.Element {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex items-end gap-2 animate-slide-up ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
          {/* Spur "S" logo */}
          <span className="text-white text-xs font-semibold select-none">S</span>
        </div>
      )}

      <div
        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[78%] sm:max-w-[70%]`}
      >
        {/* Message bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-brand-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
          }`}
        >
          {message.text}
        </div>

        {/* Timestamp */}
        <span className="mt-1 text-[11px] text-gray-400 px-1 select-none">
          {formatTime(message.createdAt)}
        </span>
      </div>

      {/* User avatar (initials) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-600 text-xs font-semibold select-none">You</span>
        </div>
      )}
    </div>
  );
}
