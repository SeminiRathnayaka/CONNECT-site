import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, HeartPulse, Plus, Users } from 'lucide-react';
import type { FamilyMember, Relationship } from '../../types';
import { useFamily } from '../../hooks/useFamily';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { formatDate, relativeDay } from '../../utils/dates';

const relationshipOptions: Array<{ value: Relationship; label: string }> = [
  { value: 'Self', label: 'Self' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Child', label: 'Child' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Spouse', label: 'Spouse' },
];

const genderOptions = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Other' },
];

const accents = ['blue', 'teal', 'violet', 'amber', 'rose'] as const;

interface MemberForm {
  name: string;
  relationship: Relationship;
  age: string;
  gender: string;
  bloodType: string;
  conditions: string;
  allergies: string;
  medications: string;
  notes: string;
}

const emptyForm: MemberForm = {
  name: '',
  relationship: 'Self',
  age: '',
  gender: 'Female',
  bloodType: '',
  conditions: '',
  allergies: '',
  medications: '',
  notes: '',
};

const toList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function Family() {
  const [family, setFamily] = useFamily();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const upcomingCount = family.filter((m) => m.upcomingAppointment).length;
  const ageValue = Number(form.age);
  const nameInvalid = !form.name.trim();
  const ageInvalid = !form.age.trim() || Number.isNaN(ageValue) || ageValue < 0;

  const openForm = () => {
    setForm(emptyForm);
    setSubmitted(false);
    setOpen(true);
  };

  const save = () => {
    setSubmitted(true);
    if (nameInvalid || ageInvalid) return;

    const name = form.name.trim();
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    const notes = form.notes.trim();

    const member: FamilyMember = {
      id: `f-${Date.now()}`,
      name,
      relationship: form.relationship,
      age: ageValue,
      gender: form.gender,
      bloodType: form.bloodType.trim(),
      initials,
      accent: accents[family.length % accents.length],
      conditions: toList(form.conditions),
      allergies: toList(form.allergies),
      medications: toList(form.medications),
    };
    if (notes) member.notes = notes;

    setFamily([...family, member]);
    setForm(emptyForm);
    setSubmitted(false);
    setOpen(false);
    toast('Family profile added.');
  };

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Manage family health"
        title="Family Profiles"
        description="A calm overview of everyone you care for — vitals, conditions, medications and upcoming visits."
        icon={<Users className="h-6 w-6" aria-hidden />}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/70 px-3.5 py-2 text-xs font-bold text-primary-700">
              <CalendarClock className="h-4 w-4" aria-hidden />
              {upcomingCount} upcoming visits
            </span>
            <button type="button" className={buttonClass('primary', 'sm')} onClick={openForm}>
              <Plus className="h-4 w-4" aria-hidden />
              Add member
            </button>
          </>
        }
      />

      {family.length === 0 ? (
        <EmptyState
          title="No family profiles yet"
          description="Add the people you care for to keep their vitals, medications and visits in one place."
          action={
            <button type="button" className={buttonClass('primary', 'sm')} onClick={openForm}>
              <Plus className="h-4 w-4" aria-hidden />
              Add member
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {family.map((m, i) => (
            <Link
              key={m.id}
              to={`/family/${m.id}`}
              className="glass group flex flex-col gap-4 rounded-3xl p-5 card-lift animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 55, 330)}ms` }}
            >
              <div className="flex items-center gap-3.5">
                <Avatar name={m.name} initials={m.initials} accent={m.accent} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-ink-900">{m.name}</h2>
                  <p className="text-xs text-ink-500">
                    {m.relationship} · {m.age} years · {m.gender}
                  </p>
                  {m.bloodType ? (
                    <Badge tone="neutral" className="mt-1.5">
                      Blood {m.bloodType}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <VitalCell
                  label="Heart rate"
                  value={m.vitals ? `${m.vitals.heartRate} bpm` : '—'}
                />
                <VitalCell label="Blood pressure" value={m.vitals?.bloodPressure ?? '—'} />
                <VitalCell
                  label="Glucose"
                  value={m.vitals ? `${m.vitals.glucose} mg/dL` : '—'}
                />
                <VitalCell label="Weight" value={m.vitals ? `${m.vitals.weight} kg` : '—'} />
              </dl>

              <div className="flex flex-wrap gap-1.5">
                {m.conditions.length > 0 ? (
                  m.conditions.map((c) => (
                    <Badge key={c} tone="warn">
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="ok">No recorded conditions</Badge>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
                {m.upcomingAppointment ? (
                  <span className="flex items-center gap-1.5 font-semibold text-primary-600">
                    <HeartPulse className="h-3.5 w-3.5" aria-hidden />
                    Visit {relativeDay(m.upcomingAppointment.date)} ·{' '}
                    {formatDate(m.upcomingAppointment.date)}
                  </span>
                ) : (
                  <span className="text-ink-400">No upcoming visit</span>
                )}
                <span className="font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add family member"
        description="Profiles are stored on this device."
        size="lg"
        footer={
          <>
            <button
              type="button"
              className={buttonClass('ghost', 'sm')}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={save}>
              Add member
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              required
            />
            {submitted && nameInvalid ? (
              <p className="mt-1.5 text-xs font-semibold text-alert-600">Name is required.</p>
            ) : null}
          </div>

          <Select
            label="Relationship"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value as Relationship })}
            options={relationshipOptions}
          />

          <div>
            <Input
              label="Age"
              type="number"
              min={0}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="Years"
              required
            />
            {submitted && ageInvalid ? (
              <p className="mt-1.5 text-xs font-semibold text-alert-600">Enter a valid age.</p>
            ) : null}
          </div>

          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={genderOptions}
          />

          <Input
            label="Blood type"
            value={form.bloodType}
            onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
            placeholder="e.g. O+"
          />

          <Input
            label="Conditions"
            value={form.conditions}
            onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            placeholder="Comma-separated"
          />

          <Input
            label="Allergies"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="Comma-separated"
          />

          <Input
            label="Medications"
            value={form.medications}
            onChange={(e) => setForm({ ...form, medications: e.target.value })}
            placeholder="Comma-separated"
          />

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything worth remembering about this profile…"
            className="sm:col-span-2"
          />
        </div>
      </Modal>
    </div>
  );
}

function VitalCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 px-3 py-2">
      <dt className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">{label}</dt>
      <dd className="mt-0.5 font-bold text-ink-800">{value}</dd>
    </div>
  );
}
