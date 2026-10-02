import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Info,
  MessageCircle,
  Plus,
  Send,
  ShieldAlert,
  Siren,
  Trash2,
} from 'lucide-react';
import type { ChatConversation, ChatMessage } from '../../types';
import {
  baymaxDisclaimer,
  emergencyLine,
  getBaymaxReply,
  isEmergencyLanguage,
  suggestedQuestions,
} from '../../data/mockAI';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { timeNow } from '../../utils/dates';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { EmergencyNotice, MessageBubble } from './MessageBubble';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello, I'm Baymax — your personal health assistant.\n\nTell me how you're feeling, ask about a symptom, or ask how to prepare for your next appointment. I'll reply in calm, simple steps.",
  timestamp: timeNow(),
};

function createConversation(index: number): ChatConversation {
  return {
    id: `c-${Date.now()}-${index}`,
    title: 'New conversation',
    messages: [{ ...WELCOME, id: `w-${Date.now()}-${index}`, timestamp: timeNow() }],
    updatedAt: new Date().toISOString(),
  };
}

export default function Baymax() {
  const [conversations, setConversations] = useLocalStorage<ChatConversation[]>(
    'connect_baymax_conversations',
    [],
  );
  const [activeId, setActiveId] = useLocalStorage<string>('connect_baymax_active', '');
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  /* Ensure at least one conversation exists */
  useEffect(() => {
    if (conversations.length === 0) {
      const first = createConversation(0);
      setConversations([first]);
      setActiveId(first.id);
    } else if (!conversations.some((c) => c.id === activeId)) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId, setConversations, setActiveId]);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [active?.messages.length, typing]);

  useEffect(() => () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
  }, []);

  const updateActive = (next: ChatConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const handleSend = (raw: string) => {
    const text = raw.trim();
    if (!text || !active || typing) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeNow(),
    };

    const title =
      active.messages.length <= 1 ? text.slice(0, 34) + (text.length > 34 ? '…' : '') : active.title;

    updateActive({
      ...active,
      title,
      messages: [...active.messages, userMsg],
      updatedAt: new Date().toISOString(),
    });
    setInput('');
    setTyping(true);

    const delay = 650 + Math.min(text.length * 12, 900);
    typingTimer.current = window.setTimeout(() => {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: getBaymaxReply(text),
        timestamp: timeNow(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? { ...c, messages: [...c.messages, reply], updatedAt: new Date().toISOString() }
            : c,
        ),
      );
      setTyping(false);
    }, delay);
  };

  const handleNewChat = () => {
    const fresh = createConversation(conversations.length);
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSidebarOpen(false);
    setInput('');
  };

  const handleDelete = (id: string) => {
    const next = conversations.filter((c) => c.id !== id);
    if (next.length === 0) {
      const fresh = createConversation(0);
      setConversations([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setConversations(next);
    if (id === activeId) setActiveId(next[0].id);
  };

  const showSuggestions = active && active.messages.length <= 1;

  return (
    <div className="page-container py-6 sm:py-8">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={cn(
            'glass-strong fixed inset-y-0 left-0 z-40 w-[82vw] max-w-xs overflow-y-auto rounded-none p-4 transition-transform duration-300 lg:static lg:z-auto lg:max-h-[76vh] lg:w-auto lg:translate-x-0 lg:rounded-3xl',
            sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]',
          )}
          aria-label="Conversation history"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink-900">Conversations</h2>
            <button
              type="button"
              onClick={handleNewChat}
              className={buttonClass('soft', 'sm')}
              aria-label="Start a new conversation"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New chat
            </button>
          </div>

          <ul className="space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <div
                  className={cn(
                    'group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition',
                    c.id === active?.id
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-transparent bg-white/50 hover:bg-white/90',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(c.id);
                      setSidebarOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                    <span className="truncate text-xs font-semibold text-ink-700">{c.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg p-1 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-alert-50 hover:text-alert-600 focus:opacity-100"
                    aria-label={`Delete conversation: ${c.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/70 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-primary-700">
              <Info className="h-3.5 w-3.5" aria-hidden /> Good to know
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{baymaxDisclaimer}</p>
          </div>

          <Link
            to="/emergency"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-alert-100 bg-alert-50 px-3 py-2.5 text-xs font-bold text-alert-700 transition hover:bg-alert-100"
          >
            <Siren className="h-4 w-4" aria-hidden />
            Emergency access
          </Link>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-ink-950/30 backdrop-blur-[2px] lg:hidden"
            aria-label="Close history panel"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* ---------------- Chat panel ---------------- */}
        <section className="glass flex min-h-[70vh] flex-col overflow-hidden rounded-3xl">
          <header className="flex items-center gap-3 border-b border-ink-100/80 bg-white/60 px-4 py-3.5 sm:px-5">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 bg-white/80 text-ink-600 lg:hidden"
              aria-label="Toggle conversation history"
            >
              <MessageCircle className="h-4 w-4" />
            </button>

            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 text-white shadow-[0_10px_22px_-14px_rgba(13,148,136,0.9)]">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-ink-900">Baymax AI</h1>
              <p className="flex items-center gap-1.5 text-xs text-ink-500">
                <span className="h-1.5 w-1.5 rounded-full bg-ok-500" aria-hidden />
                Personal Health Assistant · online
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewChat}
              className={buttonClass('soft', 'sm')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-xl items-start gap-2 rounded-2xl border border-warn-100 bg-warn-50/80 px-4 py-2.5 text-xs leading-relaxed text-warn-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-bold">General information only.</strong>{' '}
                {emergencyLine}
              </span>
            </div>

            {active?.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {active?.messages.some((m) => m.role === 'user') &&
            isEmergencyLanguage(
              [...active.messages].reverse().find((m) => m.role === 'user')?.content ?? '',
            ) ? <EmergencyNotice /> : null}

            {typing ? (
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-aqua-400 to-aqua-600 text-white">
                  <Bot className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/85 px-4 py-3 ring-1 ring-ink-100">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-pulse-soft rounded-full bg-primary-400"
                      style={{ animationDelay: `${i * 160}ms` }}
                      aria-hidden
                    />
                  ))}
                  <span className="sr-only">Baymax is typing</span>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && !typing ? (
            <div className="border-t border-ink-100/80 bg-white/50 px-4 py-3 sm:px-6">
              <p className="mb-2 text-xs font-semibold text-ink-500">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-primary-100 bg-white/85 px-3.5 py-2 text-xs font-medium text-primary-700 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Composer */}
          <form
            className="border-t border-ink-100/80 bg-white/60 px-4 py-4 sm:px-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-white/90 p-2 transition focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100">
              <label htmlFor="baymax-input" className="sr-only">
                Describe how you're feeling
              </label>
              <textarea
                id="baymax-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Describe how you're feeling…"
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-[0_10px_20px_-12px_rgba(37,99,235,0.9)] transition hover:scale-105 disabled:scale-100 disabled:opacity-45"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-400">
              Baymax AI shares general health information only — it does not diagnose conditions
              or replace professional medical care.
            </p>
          </form>
        </section>
      </div>

      {conversations.length === 0 && active === undefined ? (
        <EmptyState title="No conversations yet" description="Start a new chat with Baymax." />
      ) : null}
    </div>
  );
}
