import { useState } from 'react';
import {
  AlertTriangle,
  HeartPulse,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EmergencyContact } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormControls';

const services = [
  { label: 'Ambulance', number: '1990', note: 'Suwa Seriya emergency ambulance' },
  { label: 'Police', number: '119', note: 'National police emergency line' },
  { label: 'Fire & Rescue', number: '110', note: 'Fire brigade emergency line' },
];

const emptyContactForm = { name: '', relation: '', phone: '' };

const emptyInfoForm = {
  bloodType: '',
  allergies: '',
  conditions: '',
  medications: '',
  notes: '',
};

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export default function Emergency() {
  const [contacts, setContacts] = useLocalStorage<EmergencyContact[]>(
    'connect_emergency_contacts',
    [],
  );
  const [info, setInfo] = useLocalStorage('connect_emergency_info', {
    bloodType: '',
    allergies: [] as string[],
    conditions: [] as string[],
    medications: [] as string[],
    notes: [] as string[],
  });
  const { toast } = useToast();

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [toRemove, setToRemove] = useState<EmergencyContact | null>(null);

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoForm, setInfoForm] = useState(emptyInfoForm);

  const canSaveContact =
    contactForm.name.trim() !== '' &&
    contactForm.relation.trim() !== '' &&
    contactForm.phone.trim() !== '';

  const openContact = () => {
    setContactForm(emptyContactForm);
    setContactOpen(true);
  };

  const saveContact = () => {
    if (!canSaveContact) return;
    const payload: EmergencyContact = {
      id: `ec-${Date.now()}`,
      name: contactForm.name.trim(),
      relation: contactForm.relation.trim(),
      phone: contactForm.phone.trim(),
    };
    setContacts((prev) => [payload, ...prev]);
    setContactOpen(false);
    setContactForm(emptyContactForm);
    toast('Contact added.');
  };

  const confirmRemove = () => {
    if (!toRemove) return;
    setContacts((prev) => prev.filter((c) => c.id !== toRemove.id));
    setToRemove(null);
    toast('Contact removed.', 'info');
  };

  const openInfo = () => {
    setInfoForm({
      bloodType: info.bloodType,
      allergies: info.allergies.join('\n'),
      conditions: info.conditions.join('\n'),
      medications: info.medications.join('\n'),
      notes: info.notes.join('\n'),
    });
    setInfoOpen(true);
  };

  const saveInfo = () => {
    setInfo({
      bloodType: infoForm.bloodType.trim(),
      allergies: splitLines(infoForm.allergies),
      conditions: splitLines(infoForm.conditions),
      medications: splitLines(infoForm.medications),
      notes: splitLines(infoForm.notes),
    });
    setInfoOpen(false);
    toast('Medical information updated.');
  };

  const addContactButton = (
    <button type="button" className={buttonClass('primary', 'sm')} onClick={openContact}>
      <Plus className="h-4 w-4" aria-hidden />
      Add contact
    </button>
  );

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="24/7 quick access"
        title="Emergency Access"
        description="The essential information you or a responder may need in an urgent situation — kept calm, clear and ready."
        icon={<HeartPulse className="h-6 w-6" aria-hidden />}
        actions={
          <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print this page
          </button>
        }
      />

      {/* Call services */}
      <section className="mb-5" aria-labelledby="call-title">
        <div className="glass-tint rounded-[28px] border border-primary-100 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-alert-600 shadow-sm">
              <PhoneCall className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="call-title" className="text-base font-bold text-ink-900 sm:text-lg">
                In an emergency, call first
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
                If someone has severe chest pain, trouble breathing, heavy bleeding, loses
                consciousness or shows signs of a stroke, contact emergency services immediately.
                Do not wait for an app.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {services.map((s) => (
              <a
                key={s.number}
                href={`tel:${s.number}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-alert-500 to-alert-600 text-white">
                  <Phone className="h-4.5 w-4.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-ink-500">{s.label}</span>
                  <span className="block text-lg font-extrabold text-ink-900">{s.number}</span>
                  <span className="block text-[11px] text-ink-400">{s.note}</span>
                </span>
              </a>
            ))}
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-warn-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Numbers shown are for Sri Lanka. If you are elsewhere, use your local emergency
            number.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal contacts */}
        <section aria-labelledby="contacts-title">
          <GlassCard className="h-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="contacts-title" className="text-base font-bold text-ink-900">
                My emergency contacts
              </h2>
              {addContactButton}
            </div>

            {contacts.length === 0 ? (
              <EmptyState
                title="No emergency contacts yet"
                description="Add the people you would want called first in an urgent situation."
                action={addContactButton}
              />
            ) : (
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink-900">{c.name}</p>
                      <p className="text-xs text-ink-500">{c.relation}</p>
                      <p className="text-xs font-semibold text-primary-600">{c.phone}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={`tel:${c.phone.replace(/\s/g, '')}`}
                        className={buttonClass('primary', 'sm')}
                        aria-label={`Call ${c.name}`}
                      >
                        <Phone className="h-4 w-4" aria-hidden />
                        Call
                      </a>
                      <button
                        type="button"
                        className={buttonClass('danger', 'sm')}
                        onClick={() => setToRemove(c)}
                        aria-label={`Remove ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link
              to="/family"
              className={buttonClass('ghost', 'sm', 'mt-4 inline-flex')}
            >
              Manage family profiles
            </Link>
          </GlassCard>
        </section>

        {/* Medical info */}
        <section aria-labelledby="info-title">
          <GlassCard className="h-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="info-title" className="text-base font-bold text-ink-900">
                Important medical information
              </h2>
              <div className="flex items-center gap-2">
                {info.bloodType ? <Badge tone="alert">Blood {info.bloodType}</Badge> : null}
                <button type="button" className={buttonClass('secondary', 'sm')} onClick={openInfo}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </button>
              </div>
            </div>

            <InfoList title="Allergies" tone="alert" items={info.allergies} marker="alert" />
            <InfoList title="Conditions" tone="warn" items={info.conditions} marker="bullet" />
            <InfoList
              title="Current medications"
              tone="primary"
              items={info.medications}
              marker="bullet"
            />
            <InfoList title="Emergency notes" tone="aqua" items={info.notes} marker="bullet" />
          </GlassCard>
        </section>
      </div>

      <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3.5 text-xs leading-relaxed text-warn-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        CONNECT helps you stay organized, but it cannot call for help or monitor you. In any
        emergency, contact local emergency services or go to the nearest hospital. This screen is
        for reference only and is not a substitute for professional medical care.
      </p>

      {/* Add contact */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add emergency contact"
        description="Saved on this device only."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={buttonClass('ghost', 'sm')}
              onClick={() => setContactOpen(false)}
            >
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={saveContact} disabled={!canSaveContact}>
              Add contact
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            label="Name"
            required
            value={contactForm.name}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            placeholder="Full name"
          />
          <Input
            label="Relation"
            required
            value={contactForm.relation}
            onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
            placeholder="e.g. Spouse"
          />
          <Input
            label="Phone"
            type="tel"
            required
            value={contactForm.phone}
            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            placeholder="e.g. 077 123 4567"
          />
        </div>
      </Modal>

      {/* Remove contact */}
      <Modal
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        title="Remove this contact?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={buttonClass('ghost', 'sm')}
              onClick={() => setToRemove(null)}
            >
              Keep it
            </button>
            <button type="button" className={buttonClass('danger', 'sm')} onClick={confirmRemove}>
              Remove
            </button>
          </>
        }
      >
        <p>
          <strong>{toRemove?.name}</strong> will be removed from your emergency contacts.
        </p>
      </Modal>

      {/* Edit medical information */}
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Edit medical information"
        description="Saved on this device only. Leave anything you have not recorded blank."
        size="lg"
        footer={
          <>
            <button
              type="button"
              className={buttonClass('ghost', 'sm')}
              onClick={() => setInfoOpen(false)}
            >
              Cancel
            </button>
            <Button variant="primary" size="sm" onClick={saveInfo}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            label="Blood type"
            value={infoForm.bloodType}
            onChange={(e) => setInfoForm({ ...infoForm, bloodType: e.target.value })}
            placeholder="e.g. O+"
          />
          <Textarea
            label="Allergies"
            value={infoForm.allergies}
            onChange={(e) => setInfoForm({ ...infoForm, allergies: e.target.value })}
            placeholder="Penicillin"
            hint="One item per line."
          />
          <Textarea
            label="Conditions"
            value={infoForm.conditions}
            onChange={(e) => setInfoForm({ ...infoForm, conditions: e.target.value })}
            placeholder="Asthma"
            hint="One item per line."
          />
          <Textarea
            label="Current medications"
            value={infoForm.medications}
            onChange={(e) => setInfoForm({ ...infoForm, medications: e.target.value })}
            placeholder="Salbutamol inhaler"
            hint="One item per line."
          />
          <Textarea
            label="Emergency notes"
            value={infoForm.notes}
            onChange={(e) => setInfoForm({ ...infoForm, notes: e.target.value })}
            placeholder="Anything a responder should know"
            hint="One item per line."
          />
        </div>
      </Modal>
    </div>
  );
}

const toneStyles = {
  alert: 'border-alert-100 bg-alert-50/70',
  warn: 'border-warn-100 bg-warn-50/70',
  primary: 'border-primary-100 bg-primary-50/70',
  aqua: 'border-aqua-100 bg-aqua-50/70',
};

function InfoBlock({
  title,
  tone,
  children,
}: {
  title: string;
  tone: keyof typeof toneStyles;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-3 rounded-2xl border px-4 py-3.5 text-sm leading-relaxed text-ink-700 ${toneStyles[tone]}`}>
      <p className="mb-1.5 text-xs font-bold tracking-wide text-ink-500 uppercase">{title}</p>
      {children}
    </div>
  );
}

function InfoList({
  title,
  tone,
  items,
  marker,
}: {
  title: string;
  tone: keyof typeof toneStyles;
  items: string[];
  marker: 'alert' | 'bullet';
}) {
  return (
    <InfoBlock title={title} tone={tone}>
      {items.length === 0 ? (
        <p className="text-sm italic text-ink-400">Not recorded yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              {marker === 'alert' ? (
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert-500"
                  aria-hidden
                />
              ) : null}
              {marker === 'bullet' ? `• ${item}` : item}
            </li>
          ))}
        </ul>
      )}
    </InfoBlock>
  );
}
