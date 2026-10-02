import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Check,
  ClipboardList,
  Lightbulb,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import type { Appointment, DoctorQuestion } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormControls';
import { formatDate, relativeDay } from '../../utils/dates';
import { cn } from '../../utils/cn';

const suggestions = [
  'What are the likely causes of my symptoms?',
  'Do I need any tests, and what do they involve?',
  'Are my current medicines still the right choice?',
  'What side effects should I watch for?',
  'What lifestyle changes would help most right now?',
  'How often should I come in for follow-up?',
  'What signs mean I should come back sooner?',
  'Can you explain my last blood test in simple words?',
];

export default function DoctorPrep() {
  const [questions, setQuestions] = useLocalStorage<DoctorQuestion[]>(
    'connect_doctor_questions',
    [],
  );
  const [notes, setNotes] = useLocalStorage<string>('connect_doctor_notes', '');
  const [appointments] = useLocalStorage<Appointment[]>('connect_appointments', []);
  const [draft, setDraft] = useState('');
  const { toast } = useToast();

  const nextVisit = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const addQuestion = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (questions.some((q) => q.text.toLowerCase() === clean.toLowerCase())) {
      toast('That question is already on your list.', 'info');
      return;
    }
    setQuestions((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, text: clean, category: 'My question', done: false },
    ]);
    setDraft('');
    toast('Question added to your checklist.');
  };

  const toggle = (id: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, done: !q.done } : q)));

  const remove = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const availableSuggestions = suggestions.filter(
    (s) => !questions.some((q) => q.text.toLowerCase() === s.toLowerCase()),
  );

  const doneCount = questions.filter((q) => q.done).length;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Prepare questions"
        title="Doctor Prep"
        description="Build a short checklist for your next visit so nothing important gets forgotten."
        icon={<ClipboardList className="h-6 w-6" aria-hidden />}
        actions={
          <button
            type="button"
            className={buttonClass('secondary', 'sm')}
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print checklist
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Checklist */}
        <section className="lg:col-span-2" aria-labelledby="checklist-title">
          <GlassCard className="mb-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="checklist-title" className="text-base font-bold text-ink-900">
                  My questions
                </h2>
                <p className="text-xs text-ink-500">
                  {doneCount} of {questions.length} discussed
                </p>
              </div>
              {questions.length > 0 ? (
                <div className="h-2 w-32 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-aqua-400 transition-[width] duration-500"
                    style={{
                      width: `${questions.length ? (doneCount / questions.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addQuestion(draft);
              }}
            >
              <label htmlFor="new-question" className="sr-only">
                Add your own question
              </label>
              <Input
                id="new-question"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your own question…"
              />
              <Button type="submit" variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            </form>

            {questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                description="Add your own, or pick from the suggestions on the right."
              />
            ) : (
              <ul className="space-y-2.5">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border px-4 py-3 transition',
                      q.done
                        ? 'border-ok-100 bg-ok-50/70'
                        : 'border-ink-100 bg-white/70 hover:border-primary-200',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(q.id)}
                      className={cn(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                        q.done
                          ? 'border-ok-500 bg-ok-500 text-white'
                          : 'border-ink-300 bg-white hover:border-primary-400',
                      )}
                      aria-label={q.done ? 'Mark as not discussed' : 'Mark as discussed'}
                      aria-pressed={q.done}
                    >
                      {q.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm leading-relaxed',
                        q.done ? 'text-ink-400 line-through' : 'text-ink-700',
                      )}
                    >
                      {q.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(q.id)}
                      className="rounded-lg p-1 text-ink-400 transition hover:bg-alert-50 hover:text-alert-600"
                      aria-label={`Remove question: ${q.text}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 text-base font-bold text-ink-900">Notes for the visit</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Symptom timeline, medicines you brought, questions from family…"
              className="min-h-36"
              aria-label="Notes for the visit"
            />
            <p className="mt-2 text-xs text-ink-400">Saved automatically on this device.</p>
          </GlassCard>
        </section>

        {/* Sidebar */}
        <div className="space-y-4">
          {nextVisit ? (
            <GlassCard variant="tint">
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary-600 uppercase">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Your next appointment
              </p>
              <p className="mt-2 text-sm font-bold text-ink-900">{nextVisit.doctor}</p>
              <p className="text-xs text-ink-500">{nextVisit.specialty}</p>
              <p className="mt-2 text-xs text-ink-600">
                {relativeDay(nextVisit.date)} · {formatDate(nextVisit.date)} at {nextVisit.time}
              </p>
              <Link
                to="/appointments"
                className={buttonClass('soft', 'sm', 'mt-3 inline-flex')}
              >
                Manage appointments
              </Link>
            </GlassCard>
          ) : null}

          <GlassCard>
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink-900">
              <Lightbulb className="h-4 w-4 text-warn-500" aria-hidden />
              Suggested questions
            </h2>
            <p className="mb-3 text-xs text-ink-500">Tap to add to your checklist.</p>

            {availableSuggestions.length === 0 ? (
              <p className="text-xs text-ok-600">
                You have added every suggestion — nice work!
              </p>
            ) : (
              <ul className="space-y-2">
                {availableSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => addQuestion(s)}
                      className="flex w-full items-start gap-2 rounded-xl border border-ink-100 bg-white/70 px-3 py-2.5 text-left text-xs leading-relaxed text-ink-700 transition hover:border-primary-300 hover:bg-white"
                    >
                      <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" aria-hidden />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-2 text-sm font-bold text-ink-900">Before you go</h2>
            <ul className="space-y-2 text-xs leading-relaxed text-ink-600">
              {[
                'Bring your current medicine list.',
                'Note when symptoms started.',
                'Write your top 3 concerns in order.',
                'Repeat back what you hear before leaving.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
