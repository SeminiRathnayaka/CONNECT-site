import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormControls';
import { useToast } from '../../hooks/useToast';

export type StaticVariant = 'about' | 'contact' | 'privacy' | 'terms';

const content: Record<
  StaticVariant,
  { eyebrow: string; title: string; description: string; sections: Array<{ h: string; p: string[] }> }
> = {
  about: {
    eyebrow: 'About us',
    title: 'About CONNECT',
    description:
      'CONNECT is a personal health companion designed for individuals and families who want clarity, not complexity.',
    sections: [
      {
        h: 'Why CONNECT exists',
        p: [
          'Health information is scattered across paper reports, WhatsApp messages, memory and half-filled notebooks. CONNECT brings it into one calm, organized space.',
          'The platform pairs two focused AI companions — Baymax for everyday health questions, Orayan for medical report explanations — with practical tools for records, medications and appointments.',
        ],
      },
      {
        h: 'Designed for families',
        p: [
          'Care rarely involves just one person. Family profiles keep each member’s vitals, conditions, allergies and visits separate but equally accessible.',
          'From a child’s vaccination due date to a grandparent’s blood pressure log, everyone stays visible without becoming overwhelming.',
        ],
      },
      {
        h: 'Our principles',
        p: [
          'Clarity over jargon, calm over alarm, and honesty about limits. CONNECT never diagnoses — it helps you understand and prepare, then points you to professionals who can help.',
        ],
      },
    ],
  },
  contact: {
    eyebrow: 'Get in touch',
    title: 'Contact Us',
    description: 'Questions, feedback or partnership ideas — we read every message.',
    sections: [],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    description:
      'This prototype stores data locally in your browser. This page explains what is kept and why.',
    sections: [
      {
        h: 'What we store',
        p: [
          'In this front-end prototype, your name, email, medications, appointments, symptom entries, doctor-prep notes and report history are stored in your browser’s localStorage.',
          'Nothing is sent to a server. Clearing your browser data or using the reset option removes it permanently.',
        ],
      },
      {
        h: 'Uploaded reports',
        p: [
          'Medical reports selected in Orayan are analyzed locally in the interface. Files are not transmitted anywhere and are discarded when you leave the page.',
        ],
      },
      {
        h: 'Health data caution',
        p: [
          'Do not enter real medical information into a prototype you do not control. This product is a demonstration of interface and interaction design.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    description: 'The ground rules for using CONNECT as a demonstration product.',
    sections: [
      {
        h: 'Not a medical device',
        p: [
          'CONNECT provides general health information and organizational tools. It is not a medical device, does not provide diagnosis or treatment, and is not a substitute for professional medical advice.',
        ],
      },
      {
        h: 'Emergency use',
        p: [
          'CONNECT does not contact emergency services and does not monitor your condition. In an emergency, call your local emergency number immediately.',
        ],
      },
      {
        h: 'Demo content',
        p: [
          'Profiles, reports, testimonials and readings shown in this product are fictional demo data created for demonstration purposes.',
        ],
      },
    ],
  },
};

export default function StaticPages({ variant }: { variant: StaticVariant }) {
  const page = content[variant];
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast('Please fill in every field.', 'warning');
      return;
    }
    setSent(true);
    toast('Thanks! Your message has been recorded for this demo.');
  };

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {page.sections.map((s) => (
            <GlassCard key={s.h}>
              <h2 className="mb-2 text-base font-bold text-ink-900">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mb-2 text-sm leading-relaxed text-ink-600 last:mb-0">
                  {para}
                </p>
              ))}
            </GlassCard>
          ))}

          {variant === 'contact' ? (
            <GlassCard>
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-ok-500" aria-hidden />
                  <h2 className="text-base font-bold text-ink-900">Message received</h2>
                  <p className="max-w-sm text-sm text-ink-600">
                    This is a demo, so nothing was actually sent — but the flow works end to end.
                  </p>
                  <button
                    type="button"
                    className={buttonClass('soft', 'sm')}
                    onClick={() => {
                      setSent(false);
                      setForm({ name: '', email: '', message: '' });
                    }}
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
                  <Input
                    label="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                  <Textarea
                    label="Message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help?"
                    className="min-h-32 sm:col-span-2"
                  />
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="primary" size="md">
                      <Send className="h-4 w-4" aria-hidden />
                      Send message
                    </Button>
                  </div>
                </form>
              )}
            </GlassCard>
          ) : null}
        </div>

        <aside className="space-y-4">
          <GlassCard variant="tint">
            <h2 className="mb-3 text-sm font-bold text-ink-900">Contact details</h2>
            <ul className="space-y-2.5 text-sm text-ink-700">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary-500" aria-hidden />
                support@connect.health
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary-500" aria-hidden />
                +94 11 245 8890
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                42 Flower Rd, Colombo 07, Sri Lanka
              </li>
            </ul>
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 text-sm font-bold text-ink-900">Quick links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/baymax" className="font-medium text-primary-600 hover:underline">
                  Ask Baymax AI
                </Link>
              </li>
              <li>
                <Link to="/orayan" className="font-medium text-primary-600 hover:underline">
                  Analyze a report
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="font-medium text-primary-600 hover:underline">
                  Emergency access
                </Link>
              </li>
            </ul>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
