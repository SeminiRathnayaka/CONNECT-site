import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
  Video,
  XCircle,
} from 'lucide-react';
import type { Appointment } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { formatDate, relativeDay } from '../../utils/dates';
import { cn } from '../../utils/cn';

type Tab = 'upcoming' | 'past';

const emptyForm = {
  doctor: '',
  specialty: '',
  date: '',
  time: '09:00',
  location: '',
  mode: 'In person',
  reason: '',
};

export default function Appointments() {
  const [items, setItems] = useLocalStorage<Appointment[]>('connect_appointments', []);
  const { toast } = useToast();
  const { push } = useNotifications();

  const [tab, setTab] = useState<Tab>('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  const groups = useMemo(() => {
    const upcoming = items
      .filter((a) => a.status === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = items
      .filter((a) => a.status !== 'upcoming')
      .sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming, past };
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setFormOpen(true);
  };

  const openReschedule = (a: Appointment) => {
    setEditingId(a.id);
    setForm({
      doctor: a.doctor,
      specialty: a.specialty,
      date: a.date,
      time: a.time,
      location: a.location,
      mode: a.mode,
      reason: a.reason,
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.doctor.trim() || !form.date) {
      toast('Doctor and date are required.', 'warning');
      return;
    }
    const payload: Appointment = {
      id: editingId ?? `a-${Date.now()}`,
      doctor: form.doctor.trim(),
      specialty: form.specialty.trim() || 'General Practice',
      date: form.date,
      time: form.time,
      location: form.location.trim() || 'To be confirmed',
      mode: form.mode as Appointment['mode'],
      reason: form.reason.trim() || 'Consultation',
      status: editingId ? (items.find((a) => a.id === editingId)?.status ?? 'upcoming') : 'upcoming',
    };
    setItems((prev) =>
      editingId ? prev.map((a) => (a.id === editingId ? payload : a)) : [payload, ...prev],
    );
    setFormOpen(false);
    toast(editingId ? 'Appointment rescheduled.' : 'Appointment added to your calendar.');
    if (editingId) {
      push({
        title: 'Appointment rescheduled',
        body: `${payload.doctor} · ${relativeDay(payload.date)} at ${payload.time}.`,
        type: 'appointment',
        link: '/appointments',
      });
    } else {
      push({
        title: 'Appointment confirmed',
        body: `${payload.doctor} · ${payload.specialty} · ${relativeDay(payload.date)} at ${payload.time}.`,
        type: 'appointment',
        link: '/appointments',
      });
    }
  };

  const confirmCancel = () => {
    if (!toCancel) return;
    setItems((prev) =>
      prev.map((a) => (a.id === toCancel.id ? { ...a, status: 'cancelled' as const } : a)),
    );
    toast('Appointment cancelled.', 'info');
    setToCancel(null);
    setViewing(null);
  };

  const visible = tab === 'upcoming' ? groups.upcoming : groups.past;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Manage schedule"
        title="Appointments"
        description="Upcoming visits, past consultations and everything in between."
        icon={<CalendarDays className="h-6 w-6" aria-hidden />}
        actions={
          <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add appointment
          </button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-full border border-ink-200 bg-white/70 p-1" role="tablist">
        {(
          [
            { key: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
            { key: 'past', label: 'Past', count: groups.past.length },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition',
              tab === t.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-ink-500 hover:text-primary-600',
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-[11px]">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          description={
            tab === 'upcoming'
              ? 'Book a visit and it will appear here with reminders.'
              : 'Completed and cancelled visits will be listed here.'
          }
          action={
            tab === 'upcoming' ? (
              <button type="button" className={buttonClass('primary', 'sm')} onClick={openAdd}>
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Add appointment
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3.5">
          {visible.map((a, i) => (
            <li
              key={a.id}
              className="glass flex flex-col gap-4 rounded-3xl p-5 animate-fade-up sm:flex-row sm:items-center"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <div className="flex items-center gap-4 sm:w-64">
                <span
                  className={cn(
                    'grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white',
                    a.status === 'upcoming'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                      : a.status === 'completed'
                        ? 'bg-gradient-to-br from-ok-500 to-ok-600'
                        : 'bg-gradient-to-br from-ink-400 to-ink-500',
                  )}
                >
                  <span className="text-center leading-none">
                    <span className="block text-[10px] font-semibold opacity-80">
                      {new Date(a.date).toLocaleString([], { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="mt-1 block text-xl font-extrabold">
                      {new Date(a.date).getDate()}
                    </span>
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{a.doctor}</p>
                  <p className="text-xs text-ink-500">{a.specialty}</p>
                  <Badge
                    tone={
                      a.status === 'upcoming'
                        ? 'primary'
                        : a.status === 'completed'
                          ? 'ok'
                          : 'neutral'
                    }
                    className="mt-1.5"
                  >
                    {a.status === 'upcoming' ? relativeDay(a.date) : a.status}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-sm text-ink-600">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  {formatDate(a.date)} · {a.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  {a.location}
                </p>
                <p className="flex items-center gap-2">
                  {a.mode === 'Video call' ? (
                    <Video className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  ) : (
                    <Stethoscope className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  )}
                  {a.mode} · {a.reason}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col xl:flex-row">
                <button
                  type="button"
                  className={buttonClass('secondary', 'sm')}
                  onClick={() => setViewing(a)}
                >
                  View
                </button>
                {a.status === 'upcoming' ? (
                  <>
                    <button
                      type="button"
                      className={buttonClass('soft', 'sm')}
                      onClick={() => openReschedule(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className={buttonClass('danger', 'sm')}
                      onClick={() => setToCancel(a)}
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden />
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / reschedule */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Reschedule appointment' : 'Add appointment'}
        description="Stored locally on this device."
        size="lg"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={save}>
              {editingId ? 'Save new time' : 'Add appointment'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Doctor"
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            placeholder="e.g. Dr. N. Jayasinghe"
          />
          <Input
            label="Specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            placeholder="e.g. General Practice"
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Time"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Clinic, room or video link"
          />
          <Select
            label="Mode"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value })}
            options={[
              { value: 'In person', label: 'In person' },
              { value: 'Video call', label: 'Video call' },
            ]}
          />
          <Textarea
            label="Reason for visit"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="What would you like to discuss?"
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* View details */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.doctor ?? ''}
        description={viewing ? `${viewing.specialty} · ${viewing.mode}` : ''}
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setViewing(null)}>
              Close
            </button>
            {viewing?.status === 'upcoming' ? (
              <button
                type="button"
                className={buttonClass('secondary', 'sm')}
                onClick={() => {
                  if (viewing) openReschedule(viewing);
                  setViewing(null);
                }}
              >
                Reschedule
              </button>
            ) : null}
          </>
        }
      >
        {viewing ? (
          <dl className="space-y-2.5 text-sm">
            <DetailRow label="Date" value={`${formatDate(viewing.date)} · ${viewing.time}`} />
            <DetailRow label="Location" value={viewing.location} />
            <DetailRow label="Reason" value={viewing.reason} />
            <DetailRow label="Status" value={viewing.status} />
            {viewing.notes ? <DetailRow label="Notes" value={viewing.notes} /> : null}
          </dl>
        ) : null}
      </Modal>

      {/* Cancel confirm */}
      <Modal
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        title="Cancel appointment?"
        description="You can add a new appointment at any time."
        size="sm"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setToCancel(null)}>
              Keep appointment
            </button>
            <button type="button" className={buttonClass('danger', 'sm')} onClick={confirmCancel}>
              Cancel appointment
            </button>
          </>
        }
      >
        <p>
          Cancel your visit with <strong>{toCancel?.doctor}</strong> on{' '}
          <strong>{toCancel ? formatDate(toCancel.date) : ''}</strong> at {toCancel?.time}?
        </p>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-ink-100 bg-white/70 px-3.5 py-2.5">
      <dt className="text-xs font-semibold text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}
