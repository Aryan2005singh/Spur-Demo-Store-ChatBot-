import type {
  SendMessageResponse,
  HistoryResponse,
  ApiErrorResponse,
} from '../types/index.js';

/**
 * Base URL resolution:
 *  - Development: empty string → Vite proxy handles /chat/* → localhost:3001
 *  - Production: VITE_API_BASE_URL → your Render backend URL
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Internal helpers ─────────────────────────────────────────────────────────

class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Parse response body regardless of status (error details in body)
    let data: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error ?? `Request failed with status ${response.status}`,
        response.status,
        errorData.code,
      );
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(
        'The request took too long. Please try again.',
        408,
        'TIMEOUT',
      );
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError(
        'Unable to reach the server. Please check your connection.',
        0,
        'NETWORK_ERROR',
      );
    }

    throw new ApiError(
      'An unexpected error occurred. Please try again.',
      500,
      'UNKNOWN',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Send a user message and receive an AI reply.
 * If sessionId is null (first message), backend creates and returns one.
 */
export async function sendMessage(
  message: string,
  sessionId: string | null,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      message,
      ...(sessionId ? { sessionId } : {}),
    }),
  });
}

/**
 * Fetch the full conversation history for a session.
 * Used on page load to restore previous conversation.
 */
export async function getHistory(sessionId: string): Promise<HistoryResponse> {
  return request<HistoryResponse>(`/chat/history/${encodeURIComponent(sessionId)}`);
}

/**
 * Extract a user-friendly error message from any thrown value.
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred.';
}
