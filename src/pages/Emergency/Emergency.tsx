import { AlertTriangle, HeartPulse, Phone, PhoneCall, Printer, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { emergencyInfo, mockEmergencyContacts } from '../../data/mockHealthData';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { buttonClass } from '../../components/ui/Button';

const services = [
  { label: 'Ambulance', number: '1990', note: 'Suwa Seriya emergency ambulance' },
  { label: 'Police', number: '119', note: 'National police emergency line' },
  { label: 'Fire & Rescue', number: '110', note: 'Fire brigade emergency line' },
];

export default function Emergency() {
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
            <h2 id="contacts-title" className="mb-4 text-base font-bold text-ink-900">
              My emergency contacts
            </h2>
            <ul className="space-y-3">
              {mockEmergencyContacts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-500">{c.relation}</p>
                    <p className="text-xs font-semibold text-primary-600">{c.phone}</p>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s/g, '')}`}
                    className={buttonClass('primary', 'sm')}
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Call
                  </a>
                </li>
              ))}
            </ul>

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
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="info-title" className="text-base font-bold text-ink-900">
                Important medical information
              </h2>
              <Badge tone="alert">Blood {emergencyInfo.bloodType}</Badge>
            </div>

            <InfoBlock title="Allergies" tone="alert">
              <ul className="space-y-1.5">
                {emergencyInfo.allergies.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert-500" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </InfoBlock>

            <InfoBlock title="Conditions" tone="warn">
              <ul className="space-y-1.5">
                {emergencyInfo.conditions.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </InfoBlock>

            <InfoBlock title="Current medications" tone="primary">
              <ul className="space-y-1.5">
                {emergencyInfo.medications.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </InfoBlock>

            <InfoBlock title="Emergency notes" tone="aqua">
              <ul className="space-y-1.5">
                {emergencyInfo.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </InfoBlock>
          </GlassCard>
        </section>
      </div>

      <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3.5 text-xs leading-relaxed text-warn-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        CONNECT helps you stay organized, but it cannot call for help or monitor you. In any
        emergency, contact local emergency services or go to the nearest hospital. This screen is
        for reference only and is not a substitute for professional medical care.
      </p>
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
