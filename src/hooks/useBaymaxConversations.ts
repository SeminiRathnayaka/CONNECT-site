import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatConversation } from '../types';
import { useAuth } from './useAuth';
import { describeError, isSupabaseConfigured, supabase, SUPABASE_SETUP_MESSAGE } from '../lib/supabase';
import type { ChatConversationRow, ChatMessageRow } from '../lib/database.types';

/**
 * Baymax conversation history, stored in Supabase.
 *
 * These transcripts are private health conversations, so they used to be kept
 * in localStorage keyed by account. That still lost them between devices and
 * left readable history in the browser, so the words now live in the
 * chat_conversations and chat_messages tables behind Row Level Security.
 *
 * The hook returns the same [value, setValue] tuple as useLocalStorage, so the
 * page keeps its optimistic updates: the reply appears at once and is written
 * to the database a moment later.
 */

/** Matches the retention the privacy text promises. */
const MAX_CONVERSATIONS = 7;

/** Most recent turns sent to the AI, so a long thread cannot grow the prompt. */
export const MAX_HISTORY = 20;

type Setter<T> = (next: T | ((previous: T) => T)) => void;

function timeOf(row: ChatMessageRow): string {
  // Stored as an ISO string; the UI only ever shows HH:MM.
  return row.created_at.slice(11, 16);
}

export function useBaymaxConversations(): [
  ChatConversation[],
  Setter<ChatConversation[]>,
  boolean,
  (id: string) => Promise<void>,
] {
  const { user } = useAuth();
  const enabled = Boolean(user);

  const [conversations, setLocal] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(enabled);

  // How many messages each conversation had when it was last written, so the
  // sync only appends what is new instead of rewriting the whole transcript.
  const savedCounts = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      const { data: rows, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(MAX_CONVERSATIONS);

      if (!active) return;
      if (error) {
        setLoading(false);
        return;
      }

      const list = (rows ?? []) as ChatConversationRow[];
      if (list.length === 0) {
        setLoading(false);
        return;
      }

      const { data: messageRows } = await supabase
        .from('chat_messages')
        .select('*')
        .in(
          'conversation_id',
          list.map((row) => row.id),
        )
        .order('created_at', { ascending: true });

      if (!active) return;

      const grouped = new Map<string, ChatMessageRow[]>();
      for (const message of (messageRows ?? []) as ChatMessageRow[]) {
        const listForConversation = grouped.get(message.conversation_id) ?? [];
        listForConversation.push(message);
        grouped.set(message.conversation_id, listForConversation);
        savedCounts.current[message.conversation_id] =
          (savedCounts.current[message.conversation_id] ?? 0) + 1;
      }

      const hydrated: ChatConversation[] = list.map((row) => ({
        id: row.id,
        title: row.title,
        messages: (grouped.get(row.id) ?? []).map((message) => ({
          id: message.id,
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
          timestamp: timeOf(message),
        })),
        updatedAt: row.updated_at,
      }));

      setLocal(hydrated);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [enabled]);

  /** Writes changed conversations and their new messages. */
  const persist = useCallback(
    async (next: ChatConversation[]) => {
      if (!isSupabaseConfigured) return;

      // Apply the retention promise by dropping the oldest threads.
      const kept = next.slice(0, MAX_CONVERSATIONS);
      const dropped = next.slice(MAX_CONVERSATIONS);
      if (dropped.length > 0) {
        await supabase
          .from('chat_conversations')
          .delete()
          .in(
            'id',
            dropped.map((conversation) => conversation.id),
          );
      }

      for (const conversation of kept) {
        // The cast matches the convention used in useCollection.ts: the hand-written
// Database type widens inserts to Partial<Row>, which the client rejects.
await supabase.from('chat_conversations').upsert({
          id: conversation.id,
          title: conversation.title,
          updated_at: conversation.updatedAt,
        } as never);

        const alreadySaved = savedCounts.current[conversation.id] ?? 0;
        const fresh = conversation.messages.slice(alreadySaved);
        if (fresh.length === 0) continue;

        await supabase.from('chat_messages').insert(
          fresh.map((message) => ({
            id: message.id,
            conversation_id: conversation.id,
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
          })) as never,
        );
        savedCounts.current[conversation.id] = conversation.messages.length;
      }
    },
    [],
  );

  const setConversations = useCallback<Setter<ChatConversation[]>>(
    (next) => {
      setLocal((previous) => {
        const resolved = typeof next === 'function' ? next(previous) : next;
        // Wait for the re-render to land before writing.
        window.setTimeout(() => {
          void persist(resolved).catch((failure) => {
            console.warn('Could not save the conversation:', describeError(failure));
          });
        }, 0);
        return resolved;
      });
    },
    [persist],
  );

  /** Removes a conversation and its messages from the database. */
  const removeConversation = useCallback(async (id: string) => {
    delete savedCounts.current[id];
    if (!isSupabaseConfigured) return;

    // The messages go first so no orphaned rows are left behind if the
    // conversation delete is blocked by RLS.
    await supabase.from('chat_messages').delete().eq('conversation_id', id);
    await supabase.from('chat_conversations').delete().eq('id', id);
  }, []);

  return useMemo(
    () => [conversations, setConversations, loading, removeConversation],
    [conversations, setConversations, loading, removeConversation],
  );
}

/** Shown on the page when the database is not reachable yet. */
export const baymaxSetupMessage = SUPABASE_SETUP_MESSAGE;