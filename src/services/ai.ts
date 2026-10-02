/**
 * AI integration point for CONNECT.
 *
 * Point the app at any OpenAI-compatible chat-completions endpoint by setting
 * environment variables (see .env.example):
 *
 *   VITE_AI_API_URL  — full URL, e.g. https://api.openai.com/v1/chat/completions
 *                     or a proxy/backend you control (recommended in production).
 *   VITE_AI_API_KEY  — optional bearer token sent with each request.
 *   VITE_AI_MODEL    — optional model name (defaults to "gpt-4o-mini").
 *
 * Until VITE_AI_API_URL is set, isAiConfigured() returns false and every call
 * throws AiNotConnectedError, which the UI renders as a "not connected" state.
 */

const endpoint = import.meta.env.VITE_AI_API_URL as string | undefined;
const apiKey = import.meta.env.VITE_AI_API_KEY as string | undefined;
const model = (import.meta.env.VITE_AI_MODEL as string | undefined) ?? 'gpt-4o-mini';

export const NOT_CONNECTED_NOTICE =
  'The AI model is not connected yet. Set VITE_AI_API_URL in your environment to enable it.';

export function isAiConfigured(): boolean {
  return Boolean(endpoint);
}

export class AiNotConnectedError extends Error {
  constructor() {
    super(NOT_CONNECTED_NOTICE);
    this.name = 'AiNotConnectedError';
  }
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: AiMessage[];
}

/** Sends a chat request to the configured endpoint and returns the reply text. */
export async function chat({ messages }: ChatOptions): Promise<string> {
  if (!endpoint) throw new AiNotConnectedError();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    throw new Error(`AI request failed (${res.status} ${res.statusText})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    reply?: string;
    content?: string;
  };

  const reply = data.choices?.[0]?.message?.content ?? data.reply ?? data.content;
  if (typeof reply !== 'string' || reply.length === 0) {
    throw new Error('AI response was empty or in an unsupported format');
  }
  return reply;
}
