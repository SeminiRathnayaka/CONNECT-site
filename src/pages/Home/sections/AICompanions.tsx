import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileSearch,
  Languages,
  MessageCircle,
  ScanLine,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Badge } from '../../../components/ui/Badge';

const baymaxFeatures = [
  { icon: Stethoscope, label: 'Symptom guidance' },
  { icon: Sparkles, label: 'Wellness tips' },
  { icon: MessageCircle, label: '24/7 availability' },
  { icon: Bot, label: 'Health conversations' },
];

const orayanFeatures = [
  { icon: Languages, label: 'Simplified explanations' },
  { icon: Target, label: 'Key data extraction' },
  { icon: ScanLine, label: 'Out-of-range highlighting' },
  { icon: FileSearch, label: 'Report history' },
];

export function AICompanions() {
  return (
    <section className="page-container py-14 sm:py-16" aria-labelledby="ai-companions">
      <SectionHeader
        id="ai-companions"
        eyebrow="AI Companions"
        title="Meet Your AI Companions"
        subtitle="Two focused assistants — one helps you understand how you feel, the other helps you understand what your reports say."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Baymax */}
        <Link
          to="/baymax"
          className="glass group relative flex flex-col justify-between overflow-hidden rounded-[28px] p-6 card-lift sm:p-8"
        >
          <span className="absolute -top-16 -right-12 h-52 w-52 rounded-full bg-aqua-200/40 blur-3xl transition duration-500 group-hover:bg-aqua-300/60" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-aqua-600 sm:text-3xl">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 text-white shadow-[0_12px_26px_-16px_rgba(13,148,136,0.9)]">
                  <Bot className="h-6 w-6" aria-hidden />
                </span>
                Baymax AI
              </span>
              <Badge tone="aqua">Personal Health Assistant</Badge>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              A friendly companion for everyday health questions. Describe how you feel and get
              calm, structured guidance — day or night.
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {baymaxFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <li
                    key={f.label}
                    className="flex items-center gap-2.5 rounded-xl border border-aqua-100 bg-white/70 px-3 py-2.5 text-sm font-medium text-ink-700"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-aqua-600" aria-hidden />
                    {f.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-aqua-700">
            Start a conversation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>

        {/* Orayan */}
        <Link
          to="/orayan"
          className="glass group relative flex flex-col justify-between overflow-hidden rounded-[28px] p-6 card-lift sm:p-8"
        >
          <span className="absolute -top-16 -left-12 h-52 w-52 rounded-full bg-primary-200/40 blur-3xl transition duration-500 group-hover:bg-primary-300/60" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary-600 sm:text-3xl">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_12px_26px_-16px_rgba(37,99,235,0.9)]">
                  <ScanLine className="h-6 w-6" aria-hidden />
                </span>
                Orayan AI
              </span>
              <Badge tone="primary">Medical Report Assistant</Badge>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              Upload a lab report and see what each value actually means — with plain English and
              Sinhala explanations for every medical term.
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {orayanFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <li
                    key={f.label}
                    className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white/70 px-3 py-2.5 text-sm font-medium text-ink-700"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    {f.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700">
            Analyze a report
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      </div>
    </section>
  );
}
