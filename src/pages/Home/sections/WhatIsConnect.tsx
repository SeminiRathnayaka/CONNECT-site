import { useNavigate } from 'react-router-dom';
import { Bot, LockKeyhole, Users } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';

const cards = [
  {
    icon: Bot,
    title: 'AI-Powered Guidance',
    description:
      'Calm, plain-language health guidance from Baymax AI and step-by-step report explanations from Orayan AI — available whenever you need them.',
    accent: 'text-primary-600 bg-primary-50',
    to: '/baymax',
  },
  {
    icon: LockKeyhole,
    title: 'Secure Health Hub',
    description:
      'Reports, lab results, vaccinations and medical history organized in one place — stored privately on your own device for this prototype.',
    accent: 'text-aqua-600 bg-aqua-50',
    to: '/health-records',
  },
  {
    icon: Users,
    title: 'Family Health Management',
    description:
      'Follow vitals, medications and appointments for every family member, from children to grandparents, without losing track of anything.',
    accent: 'text-violet-600 bg-violet-50',
    to: '/family',
  },
];

export function WhatIsConnect() {
  const navigate = useNavigate();

  return (
    <section className="page-container py-14 sm:py-16" aria-labelledby="what-is-connect">
      <SectionHeader
        id="what-is-connect"
        eyebrow="What is CONNECT?"
        title="One calm place for your family's health"
        subtitle="CONNECT combines an AI health assistant, organized medical records and family coordination into a single, accessible companion."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.title}
              type="button"
              onClick={() => navigate(c.to)}
              className="glass glow-hover group flex h-full flex-col items-start gap-4 rounded-3xl p-6 text-left card-lift"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-1 ${c.accent}`}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink-900 sm:text-lg">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{c.description}</p>
              </div>
              <span className="mt-auto text-xs font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                Explore →
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
