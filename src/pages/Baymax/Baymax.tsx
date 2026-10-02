import { useCallback, useEffect, useRef, useState } from 'react';
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
  Unplug,
} from 'lucide-react';
import type { ChatConversation, ChatMessage } from '../../types';
import { ApiError, resetChat, sendChat } from '../../lib/api';
import type { Language } from '../../lib/api';
import { useDictation, useSpeech } from '../../lib/speech';
import { useAiStatus } from '../../hooks/useAiStatus';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { timeNow } from '../../utils/dates';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { VoiceIconButton } from '../../components/ui/VoiceIconButton';
import { MessageBubble, EmergencyNotice } from './MessageBubble';

const DISCLAIMER =
  'Baymax AI provides general health information for education only. It does not diagnose conditions and does not replace a doctor, pharmacist or emergency service.';

const EMERGENCY_LINE =
  'If this is an emergency — severe chest pain, trouble breathing, unresponsiveness, heavy bleeding or sudden weakness — contact your local emergency services immediately.';

const OFFLINE_NOTICE =
  'Baymax cannot reach the AI server right now. Start it by running "npm run dev" in the project folder.';

const OFFLINE_SI =
  'බේය්මැක්ස් දැන් AI සේවාදායකයට ප්‍රවේශය ලබා ගත නොහැක. කරුණාකර ප්‍රොජෙක්ට් එකේ "npm run dev" ධාවනය කරන්න.';

const WELCOME_TEXT: Record<Language, string> = {
  en: "Hi, I'm Baymax. Ask me about your health.",
  si: 'මම බේය්මැක්ස්. ඔබගේ සෞඛ්‍යය ගැන මෙයින් අසන්න.',
};

const EMERGENCY_LINE_SI =
  'මෙය අරමුණු ගමන්වාත්කයක් නම් — ඛණ්ඩරේ දරුණු වේදනාව, හුරුන් ගැනීමේ අපහසුතාවය, ප්‍රතිචාරය නොදැකීම, රුධිර රූපනය හෝ හදිසි අඩුතාවය — ඔබගේ ප්‍රදේශීය අරමුණු සේවා ක්‍රමය ක්ෂණික වනවා ද අමතන්න.';

const SUGGESTED_QUESTIONS: Record<Language, string[]> = {
  en: [
    'I have a headache',
    'What does a fever mean?',
    'I feel tired all the time',
    'How can I improve my sleep?',
    'My blood pressure is a little high',
    'How much water should I drink?',
    'I feel stressed and anxious',
    'How do I prepare for a doctor visit?',
  ],
  si: [
    'මට හිසරයක් ඇත',
    'උණුසුම කියන්නේ කුමක්ද?',
    'මම සහැකියෙලා බිඳවෙනවා',
    'නින්ද කොච්චර වැඩිද ගන්න පුළුවන්ද?',
    'මගේ රුධිර පීඩනය ටිකක් වැඩියි',
    'දිනට ජලය කොච්චර බොන්න ඕනද?',
    'මට තීව්‍රතාවයක් ඇත',
    'වෛද්ය කරීමකට කොහොමද සූදානම් වන්නේ?',
  ],
};

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: WELCOME_TEXT.en,
  timestamp: timeNow(),
};

const EMERGENCY_KEYWORDS = [
  'chest pain',
  "can't breathe",
  'cannot breathe',
  'trouble breathing',
  'unconscious',
  'unresponsive',
  'stroke',
  'overdose',
  'severe bleeding',
  'heavy bleeding',
  'suicide',
  'suicidal',
  'seizure',
  'anaphylaxis',
];

function isEmergencyLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => lower.includes(k));
}

function createConversation(index: number): ChatConversation {
  return {
    id: `c-${Date.now()}-${index}`,
    title: 'New conversation',
    messages: [{ ...WELCOME, id: `w-${Date.now()}-${index}`, timestamp: timeNow() }],
    updatedAt: new Date().toISOString(),
  };
}

function newId(prefix: 'u' | 'a') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  const [language, setLanguage] = useState<Language>('en');
  const { status: backend, refresh: probe } = useAiStatus();
  const bottomRef = useRef<HTMLDivElement>(null);
  const configured = backend === 'online';

  const speech = useSpeech(language);
  const dictation = useDictation(language, useCallback((text: string) => {
    setInput((current) => (current ? `${current} ${text}` : text));
  }, []));

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

  const updateActive = (next: ChatConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const appendAssistant = (conversationId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: newId('a'),
                  role: 'assistant' as const,
                  content,
                  timestamp: timeNow(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
  };

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text || !active || typing) return;
    speech.cancel();
    dictation.stop();

    const userMsg: ChatMessage = {
      id: newId('u'),
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

    if (!configured) {
      appendAssistant(active.id, language === 'si' ? OFFLINE_SI : OFFLINE_NOTICE);
      return;
    }

    setTyping(true);
    try {
      const result = await sendChat(text, active.sessionId, language);
      if (result.session_id !== active.sessionId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === active.id ? { ...c, sessionId: result.session_id } : c,
          ),
        );
      }
      appendAssistant(active.id, result.reply);
      speech.speak(result.reply);
      probe();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      if (err instanceof ApiError && err.isOffline) probe();
      appendAssistant(active.id, `Something went wrong: ${message}`);
    } finally {
      setTyping(false);
    }
  };

  const handleNewChat = () => {
    const fresh = createConversation(conversations.length);
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSidebarOpen(false);
    setInput('');
  };

  const handleDelete = (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (target?.sessionId) {
      resetChat(target.sessionId).catch(() => undefined);
    }
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
            <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{DISCLAIMER}</p>
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
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    backend === 'online'
                      ? 'bg-ok-500'
                      : backend === 'checking'
                        ? 'bg-warn-400'
                        : 'bg-alert-500',
                  )}
                  aria-hidden
                />
                {backend === 'online'
                  ? 'Personal Health Assistant · online'
                  : backend === 'checking'
                    ? 'Connecting to AI…'
                    : 'Personal Health Assistant · offline'}
              </p>
            </div>
            <LanguageToggle value={language} onChange={setLanguage} />
            <button
              type="button"
              onClick={handleNewChat}
              className={buttonClass('soft', 'sm')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </header>

          {backend !== 'online' ? (
            <div className="border-b border-primary-100 bg-primary-50/70 px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-white/80 px-3.5 py-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-600">
                  <Unplug className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary-700">
                    {backend === 'checking' ? 'Connecting to AI…' : 'AI server not running'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">
                    {language === 'si' ? OFFLINE_SI : OFFLINE_NOTICE}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Messages */}
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-xl items-start gap-2 rounded-2xl border border-warn-100 bg-warn-50/80 px-4 py-2.5 text-xs leading-relaxed text-warn-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-bold">
                  {language === 'si' ? 'සාමාන්‍ය තොරතුරු පමණක්.' : 'General information only.'}
                </strong>{' '}
                {language === 'si' ? EMERGENCY_LINE_SI : EMERGENCY_LINE}
              </span>
            </div>

            {active?.messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <MessageBubble message={m} />
                  {m.role === 'assistant' && speech.supported && m.id !== 'welcome' ? (
                    <VoiceIconButton
                      icon="speaker"
                      active={speech.speaking}
                      onClick={() =>
                        speech.speaking ? speech.cancel() : speech.speak(m.content)
                      }
                      label={
                        language === 'si'
                          ? 'කියවන්න'
                          : speech.speaking
                            ? 'Stop reading'
                            : 'Read this reply aloud'
                      }
                      className="mt-1"
                    />
                  ) : null}
                </div>
                {m.role === 'user' && isEmergencyLanguage(m.content) ? (
                  <EmergencyNotice />
                ) : null}
              </div>
            ))}

            {active && active.messages.length <= 1 && backend === 'offline' ? (
              <p className="text-center text-xs text-ink-400">
                Responses require the AI server to be running.
              </p>
            ) : null}

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
                {SUGGESTED_QUESTIONS[language].map((q) => (
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
                placeholder={
                  language === 'si'
                    ? 'ඔබගේ අත්දැකීම ලියන්න…'
                    : 'Describe how you’re feeling…'
                }
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              {dictation.supported ? (
                <VoiceIconButton
                  icon="mic"
                  active={dictation.listening}
                  onClick={dictation.toggle}
                  label={
                    language === 'si'
                      ? dictation.listening
                        ? 'නවත්වන්න'
                        : 'කතා කරන්න'
                      : dictation.listening
                        ? 'Stop dictation'
                        : 'Speak your message'
                  }
                  disabled={typing}
                />
              ) : null}
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-[0_10px_20px_-12px_rgba(37,99,235,0.9)] transition hover:scale-105 disabled:scale-100 disabled:opacity-45"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {dictation.error ? (
              <p className="mt-2 text-center text-[11px] font-semibold text-alert-600">
                {dictation.error}
              </p>
            ) : null}
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
