import { useState } from 'react';
import { CalendarDays, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Severity, SymptomEntry } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { formatDate, todayISO } from '../../utils/dates';
import { cn } from '../../utils/cn';

const severities: Severity[] = ['Mild', 'Moderate', 'Severe'];

const emptyForm = {
  date: todayISO(),
  symptom: '',
  severity: 'Mild' as Severity,
  duration: '',
  notes: '',
};

export default function SymptomJournal() {
  const [entries, setEntries] = useLocalStorage<SymptomEntry[]>('connect_symptoms', []);
  const { toast } = useToast();
  const { push } = useNotifications();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<SymptomEntry | null>(null);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: todayISO() });
    setFormOpen(true);
  };

  const openEdit = (e: SymptomEntry) => {
    setEditingId(e.id);
    setForm({
      date: e.date,
      symptom: e.symptom,
      severity: e.severity,
      duration: e.duration,
      notes: e.notes,
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.symptom.trim()) {
      toast('Please describe the symptom.', 'warning');
      return;
    }
    const payload: SymptomEntry = {
      id: editingId ?? `s-${Date.now()}`,
      date: form.date,
      symptom: form.symptom.trim(),
      severity: form.severity,
      duration: form.duration.trim() || 'Not noted',
      notes: form.notes.trim(),
    };
    setEntries((prev) =>
      editingId ? prev.map((x) => (x.id === editingId ? payload : x)) : [payload, ...prev],
    );
    setFormOpen(false);
    toast(editingId ? 'Journal entry updated.' : 'Symptom logged.');
    if (!editingId) {
      push({
        title: 'Symptom logged',
        body: `${payload.symptom} · ${payload.severity} severity · ${formatDate(payload.date)}.`,
        type: 'symptom',
        link: '/symptom-journal',
      });
    }
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setEntries((prev) => prev.filter((x) => x.id !== toDelete.id));
    toast('Entry removed from your journal.', 'info');
    setToDelete(null);
  };

  const severityTone = (s: Severity) =>
    s === 'Mild' ? 'ok' : s === 'Moderate' ? 'warn' : 'alert';

  const thisMonth = entries.filter((e) => e.date.startsWith(todayISO().slice(0, 7))).length;
  const severeCount = entries.filter((e) => e.severity === 'Severe').length;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Track symptoms"
        title="Symptom Journal"
        description="Record how you feel day by day — useful context to bring to any appointment."
        icon={<NotebookPen className="h-6 w-6" aria-hidden />}
        actions={
          <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add entry
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Total entries" value={String(entries.length)} />
        <StatTile label="Logged this month" value={String(thisMonth)} tone="text-primary-600" />
        <StatTile
          label="Severe episodes"
          value={String(severeCount)}
          tone={severeCount ? 'text-alert-600' : 'text-ok-600'}
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="Your journal is empty"
          description="Log your first symptom to start building a history you can share with your doctor."
          action={
            <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden />
              Add first entry
            </button>
          }
        />
      ) : (
        <ol className="relative space-y-3.5 border-l-2 border-primary-100 pl-5 sm:pl-7">
          {sorted.map((e, i) => (
            <li
              key={e.id}
              className="relative glass rounded-3xl p-5 animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 45, 300)}ms` }}
            >
              <span
                className={cn(
                  'absolute top-6 -left-[27px] h-3.5 w-3.5 rounded-full ring-4 ring-white sm:-left-[35px]',
                  e.severity === 'Mild'
                    ? 'bg-ok-500'
                    : e.severity === 'Moderate'
                      ? 'bg-warn-500'
                      : 'bg-alert-500',
                )}
                aria-hidden
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <CalendarDays className="h-3.5 w-3.5 text-primary-500" aria-hidden />
                    {formatDate(e.date)}
                  </p>
                  <h2 className="mt-1 text-base font-bold text-ink-900">{e.symptom}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone(e.severity)}>{e.severity}</Badge>
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className={buttonClass('ghost', 'sm')}
                    aria-label={`Edit entry: ${e.symptom}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(e)}
                    className={buttonClass('danger', 'sm')}
                    aria-label={`Delete entry: ${e.symptom}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-ink-100 px-3 py-1 font-semibold text-ink-600">
                  Duration: {e.duration}
                </span>
              </div>

              {e.notes ? (
                <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-600">
                  {e.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {/* Add / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit entry' : 'Add symptom entry'}
        description="Saved on this device."
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={save}>
              {editingId ? 'Save changes' : 'Log symptom'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Duration"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g. 2 hours"
          />
          <Input
            label="Symptom"
            value={form.symptom}
            onChange={(e) => setForm({ ...form, symptom: e.target.value })}
            placeholder="e.g. Mild headache"
            className="sm:col-span-2"
          />
          <Select
            label="Severity"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
            options={severities.map((s) => ({ value: s, label: s }))}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="What were you doing? What helped?"
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* Delete */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete this entry?"
        size="sm"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setToDelete(null)}>
              Keep it
            </button>
            <button type="button" className={buttonClass('danger', 'sm')} onClick={confirmDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>
          The entry for <strong>{toDelete?.symptom}</strong> will be removed permanently.
        </p>
      </Modal>
    </div>
  );
}

function StatTile({ label, value, tone = 'text-ink-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <p className={cn('text-2xl font-extrabold', tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}
