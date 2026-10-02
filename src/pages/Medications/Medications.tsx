import { useState } from 'react';
import {
  Check,
  Clock,
  Pencil,
  Pill,
  Plus,
  RefreshCcw,
  Trash2,
  User,
} from 'lucide-react';
import type { Medication } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { relativeDay } from '../../utils/dates';
import { cn } from '../../utils/cn';

const emptyForm = {
  name: '',
  dosage: '',
  frequency: 'Once daily',
  times: '08:00',
  nextDose: '08:00',
  prescriber: '',
  purpose: '',
  refillDate: '',
  food: 'Any time',
};

type FormState = typeof emptyForm;

export default function Medications() {
  const [meds, setMeds] = useLocalStorage<Medication[]>('connect_medications', []);
  const { toast } = useToast();
  const { push } = useNotifications();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<Medication | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (m: Medication) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      times: m.times.join(', '),
      nextDose: m.nextDose,
      prescriber: m.prescriber,
      purpose: m.purpose,
      refillDate: m.refillDate,
      food: m.food,
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast('Please enter the medication name.', 'warning');
      return;
    }
    const payload: Medication = {
      id: editingId ?? `m-${Date.now()}`,
      name: form.name.trim(),
      dosage: form.dosage.trim() || 'As prescribed',
      frequency: form.frequency,
      times: form.times.split(',').map((t) => t.trim()).filter(Boolean),
      nextDose: form.nextDose || (form.times.split(',')[0] ?? '—'),
      prescriber: form.prescriber.trim() || 'Not specified',
      purpose: form.purpose.trim() || 'General wellbeing',
      refillDate: form.refillDate,
      food: form.food as Medication['food'],
      takenToday: editingId ? (meds.find((m) => m.id === editingId)?.takenToday ?? false) : false,
    };

    setMeds((prev) =>
      editingId ? prev.map((m) => (m.id === editingId ? payload : m)) : [payload, ...prev],
    );
    setFormOpen(false);
    toast(editingId ? 'Medication updated.' : 'Medication added.');
    if (!editingId) {
      push({
        title: 'Medication added',
        body: `${payload.name} ${payload.dosage} · ${payload.frequency}.`,
        type: 'medication',
        link: '/medications',
      });
    }
  };

  const toggleTaken = (m: Medication) => {
    setMeds((prev) => prev.map((x) => (x.id === m.id ? { ...x, takenToday: !x.takenToday } : x)));
    toast(
      m.takenToday ? `${m.name} marked as not taken.` : `${m.name} marked as taken. Well done!`,
      m.takenToday ? 'info' : 'success',
    );
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setMeds((prev) => prev.filter((x) => x.id !== toDelete.id));
    toast(`${toDelete.name} removed from your list.`, 'info');
    setToDelete(null);
  };

  const takenCount = meds.filter((m) => m.takenToday).length;
  const refillSoon = meds.filter(
    (m) => m.refillDate && m.refillDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Track prescriptions"
        title="Medications"
        description="Everything you take, when it is due, and who prescribed it — with quick daily check-offs."
        icon={<Pill className="h-6 w-6" aria-hidden />}
        actions={
          <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add medication
          </button>
        }
      />

      {/* Summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Active medications" value={String(meds.length)} tone="text-primary-600" />
        <SummaryTile
          label="Taken today"
          value={`${takenCount}/${meds.length}`}
          tone="text-ok-600"
        />
        <SummaryTile
          label="Refill within 7 days"
          value={String(refillSoon.length)}
          tone={refillSoon.length ? 'text-warn-600' : 'text-ink-500'}
        />
      </div>

      {meds.length === 0 ? (
        <EmptyState
          title="No medications yet"
          description="Add your first medication to start tracking doses and refills."
          action={
            <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden />
              Add medication
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meds.map((m, i) => (
            <article
              key={m.id}
              className="glass flex flex-col gap-4 rounded-3xl p-5 card-lift animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 45, 300)}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-ink-900">{m.name}</h2>
                  <p className="text-xs text-ink-500">
                    {m.dosage} · {m.frequency}
                  </p>
                </div>
                <Badge tone={m.takenToday ? 'ok' : 'warn'}>
                  {m.takenToday ? 'Taken today' : 'Pending'}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-ink-600">{m.purpose}</p>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <InfoCell icon={<Clock className="h-3.5 w-3.5" />} label="Next dose" value={m.nextDose} />
                <InfoCell
                  icon={<RefreshCcw className="h-3.5 w-3.5" />}
                  label="Refill"
                  value={m.refillDate ? relativeDay(m.refillDate) : '—'}
                />
                <InfoCell
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Prescriber"
                  value={m.prescriber}
                />
                <InfoCell
                  icon={<Check className="h-3.5 w-3.5" />}
                  label="With food"
                  value={m.food}
                />
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                <button
                  type="button"
                  onClick={() => toggleTaken(m)}
                  className={cn(buttonClass('soft', 'sm'), !m.takenToday && 'flex-1')}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {m.takenToday ? 'Undo' : 'Mark as taken'}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(m)}
                  className={buttonClass('ghost', 'sm')}
                  aria-label={`Edit ${m.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(m)}
                  className={buttonClass('danger', 'sm')}
                  aria-label={`Delete ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit medication' : 'Add medication'}
        description="Saved locally on this device."
        size="lg"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={save}>
              {editingId ? 'Save changes' : 'Add medication'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Medication name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Metformin 500mg"
            className="sm:col-span-2"
          />
          <Input
            label="Dosage"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="e.g. 500 mg"
          />
          <Input
            label="Frequency"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            placeholder="e.g. Twice daily"
          />
          <Input
            label="Times"
            hint="Separate with commas"
            value={form.times}
            onChange={(e) => setForm({ ...form, times: e.target.value })}
            placeholder="08:00, 20:00"
          />
          <Input
            label="Next dose"
            value={form.nextDose}
            onChange={(e) => setForm({ ...form, nextDose: e.target.value })}
            placeholder="08:00"
          />
          <Input
            label="Prescriber"
            value={form.prescriber}
            onChange={(e) => setForm({ ...form, prescriber: e.target.value })}
            placeholder="e.g. Dr. N. Jayasinghe"
          />
          <Input
            label="Refill date"
            type="date"
            value={form.refillDate}
            onChange={(e) => setForm({ ...form, refillDate: e.target.value })}
          />
          <Select
            label="Food instruction"
            value={form.food}
            onChange={(e) => setForm({ ...form, food: e.target.value })}
            options={[
              { value: 'Any time', label: 'Any time' },
              { value: 'Before food', label: 'Before food' },
              { value: 'After food', label: 'After food' },
              { value: 'With food', label: 'With food' },
            ]}
          />
          <Textarea
            label="Purpose / notes"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="What is this medicine for?"
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remove medication?"
        description="This removes it from your list on this device."
        size="sm"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setToDelete(null)}>
              Keep it
            </button>
            <button type="button" className={buttonClass('danger', 'sm')} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </button>
          </>
        }
      >
        <p>
          <strong>{toDelete?.name}</strong> will be removed from your medication list.
        </p>
      </Modal>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <p className={cn('text-2xl font-extrabold', tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
        <span className="text-primary-500">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-semibold text-ink-800">{value}</dd>
    </div>
  );
}
