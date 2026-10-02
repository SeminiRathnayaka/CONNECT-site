import { useNavigate } from 'react-router-dom';
import {
  Bot,
  CalendarDays,
  ClipboardList,
  FileClock,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Pill,
  ScanLine,
  Siren,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { FeatureCard } from '../../../components/cards/FeatureCard';

type FeatureAccent = 'blue' | 'teal' | 'violet' | 'amber' | 'rose';

interface FeatureDef {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  to: string;
  accent: FeatureAccent;
}

const features: FeatureDef[] = [
  { icon: Bot, title: 'Baymax AI', subtitle: 'Personal companion', to: '/baymax', accent: 'teal' },
  { icon: ScanLine, title: 'Orayan AI', subtitle: 'Report explanation', to: '/orayan', accent: 'blue' },
  { icon: LayoutDashboard, title: 'Health Dashboard', subtitle: 'Overview', to: '/dashboard', accent: 'blue' },
  { icon: Pill, title: 'Medications', subtitle: 'Track prescriptions', to: '/medications', accent: 'violet' },
  { icon: CalendarDays, title: 'Appointments', subtitle: 'Manage schedule', to: '/appointments', accent: 'blue' },
  { icon: FolderOpen, title: 'Health Records', subtitle: 'All documents', to: '/health-records', accent: 'teal' },
  { icon: GraduationCap, title: 'Health Education', subtitle: 'Learn concepts', to: '/health-education', accent: 'amber' },
  { icon: NotebookPen, title: 'Symptom Journal', subtitle: 'Track symptoms', to: '/symptom-journal', accent: 'rose' },
  { icon: FileClock, title: 'Report History', subtitle: 'Store & compare', to: '/report-history', accent: 'blue' },
  { icon: ClipboardList, title: 'Doctor Prep', subtitle: 'Prepare questions', to: '/doctor-prep', accent: 'violet' },
  { icon: Users, title: 'Family Profiles', subtitle: 'Manage family health', to: '/family', accent: 'teal' },
  { icon: Siren, title: 'Emergency Access', subtitle: '24/7 quick access', to: '/emergency', accent: 'rose' },
];

export function FeaturesGrid() {
  const navigate = useNavigate();

  return (
    <section id="features" className="page-container py-14 sm:py-16" aria-labelledby="features-title">
      <SectionHeader
        id="features-title"
        eyebrow="Everything included"
        title="Features At A Glance"
        subtitle="Every card below opens a working part of CONNECT — no dead ends."
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.to} className="animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
              <FeatureCard
                icon={<Icon className="h-5 w-5" aria-hidden />}
                title={f.title}
                subtitle={f.subtitle}
                accent={f.accent}
                onClick={() => navigate(f.to)}
                className="h-full"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
