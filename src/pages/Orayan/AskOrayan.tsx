import { useState } from 'react';
import { Bot, Loader2, MessageCircleQuestion, Send, Sparkles } from 'lucide-react';
import { ApiError, askAboutReport, reportContext } from '../../lib/api';
import type { Language } from '../../lib/api';
import { cn } from '../../utils/cn';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { ReportMarkdown } from '../../components/ui/ReportMarkdown';
import type { MedicalReport } from '../../types';

const SUGGESTIONS: Record<Language, string[]> = {
  en: [
    'Which results should I be most worried about?',
    'What is the difference between these two tests?',
    'Do I need to repeat this test?',
    'What should I ask my doctor about this report?',
  ],
  si: [
    'මට බය විය යුතු ප්‍රතිඵල මොනවාද?',
    'මේ පරීක්ෂණ දෙක අතර වෙනස කුමක්ද?',
    'මට මෙම පරීක්ෂණය නැවත කළ යුතුද?',
    'මෙම වාර්තාවය ගැන වෛද්යවරයෙකුගෙන් මොනවාද ඇහෙන්න ඕන?',
  ],
};

interface Turn {
  id: string;
  question: string;
  answer: string;
}

/**
 * Level 3 of Orayan: free-form questions answered using the values from this
 * specific report as context.
 */
export function AskOrayan({
  report,
  language,
  onLanguageChange,
}: {
  /** The whole report, because the AI service keeps no copy of its own. */
  report: MedicalReport;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const reportName = report.fileName;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    setQuestion('');
    setError(null);
    setLoading(true);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const result = await askAboutReport(reportContext(report), text, language);
      setTurns((prev) => [
        ...prev,
        { id, question: text, answer: result.answer },
      ]);
    } catch (err) {
      setQuestion(text);
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="ask-orayan-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-aqua-500 text-white shadow-[0_12px_24px_-16px_rgba(37,99,235,0.9)]">
            <MessageCircleQuestion className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="ask-orayan-title" className="text-base font-bold text-ink-900">
              Ask about this report
            </h2>
            <p className="truncate text-xs text-ink-500">{reportName}</p>
          </div>
        </div>
        <LanguageToggle value={language} onChange={onLanguageChange} />
      </div>

      {turns.length === 0 && !loading ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-ink-500">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS[language].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-primary-100 bg-white/85 px-3.5 py-2 text-xs font-medium text-primary-700 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {turns.length > 0 || loading ? (
        <div className="mt-4 space-y-4">
          {turns.map((turn) => (
            <div key={turn.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-3.5 py-2 text-sm text-white">
                {turn.question}
              </p>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-aqua-400 to-aqua-600 text-white">
                  <Bot className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white/85 px-3.5 py-2.5 ring-1 ring-ink-100">
                  <ReportMarkdown text={turn.answer} className="space-y-2" />
                </div>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-aqua-400 to-aqua-600 text-white">
                <Bot className="h-3.5 w-3.5" aria-hidden />
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
                <span className="sr-only">Orayan is thinking</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl bg-alert-50 px-3 py-2 text-xs text-alert-700" role="alert">
          {error}
        </p>
      ) : null}

      <form
        className="mt-4 flex items-center gap-2 rounded-2xl border border-ink-200 bg-white/90 p-2 transition focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="ask-orayan" className="sr-only">
          Ask a question about this report
        </label>
        <input
          id="ask-orayan"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            language === 'si' ? 'මෙම වාර්තාවය ගැන ප්‍රශ්නයක් ඇසුම්න්න…' : 'Ask anything about this report…'
          }
          className={cn('min-h-10 flex-1 bg-transparent px-2 text-sm text-ink-800 outline-none placeholder:text-ink-400')}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white transition hover:scale-105 disabled:scale-100 disabled:opacity-45"
          aria-label="Ask Orayan"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin-slow" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
        </button>
      </form>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-400">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Orayan answers using the values on this report. It cannot diagnose — always confirm anything
        important with your doctor.
      </p>
    </section>
  );
}