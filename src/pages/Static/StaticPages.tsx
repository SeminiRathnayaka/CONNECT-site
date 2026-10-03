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
      'This page explains what CONNECT stores, where it is stored, and who can see it.',
    sections: [
      {
        h: 'Your account',
        p: [
          'CONNECT now uses a real account with a password. Your email address and a securely hashed version of your password are stored in our database. We never store your actual password, and it is never saved in your browser.',
          'Signing in creates a session cookie in your browser. That cookie is what keeps you signed in, and signing out clears it.',
        ],
      },
      {
        h: 'What we store',
        p: [
          'The reports you upload to Orayan are sent to our server, stored in a database, and are linked to your account.',
          'Your Baymax conversations are stored against your account so the assistant can remember context. We keep your 7 most recent conversations, and older ones are deleted automatically.',
          'Orayan keeps your reports for 3 months. Older reports are deleted automatically.',
          'Certain local settings still stay in your browser’s localStorage on this device.',
        ],
      },
      {
        h: 'Who can see your data',
        p: [
          'Your reports and conversations are visible only while you are signed in to your own account. One person cannot see another person’s reports or chats, even on the same device.',
          'Your report text is sent to Google’s Gemini AI to generate the explanations. Please do not use CONNECT for anything you would not share with that service.',
        ],
      },
      {
        h: 'Keeping it private',
        p: [
          'Please sign out on shared computers. Anyone who is signed in to your account can read your report history, so keep your password private.',
          'Because data now lives on a server, clearing your browser data alone will not remove it. Contact us if you want your history deleted.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    description: 'The ground rules for using CONNECT.',
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
          'CONNECT does not contact emergency services and does not monitor your condition. In an emergency, call your local emergency number immediately or go to the nearest hospital.',
        ],
      },
      {
        h: 'No medical advice',
        p: [
          'Articles, glossary entries and other educational content in CONNECT are provided for general information only. They are not medical advice and should not be relied on for diagnosis or treatment. Always consult a qualified healthcare professional about your health.',
        ],
      },
      {
        h: 'Your information',
        p: [
          'CONNECT stores the information you enter on this device. You are responsible for the accuracy of what you record and for keeping access to your device secure.',
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
    toast('Thanks for reaching out — we’ll get back to you soon.');
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
                    We’ve received your message and will reply as soon as we can.
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
