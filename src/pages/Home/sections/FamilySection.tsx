import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, HeartPulse, Pill } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { buttonClass } from '../../../components/ui/Button';
import {
  FamilyImagePlaceholder,
  SmartImage,
} from '../../../components/images/Placeholders';
import familyProfilesImg from '../../../assets/images/family-profiles.jpg';

const placeholderSlots = [0, 1, 2, 3];

export function FamilySection() {
  return (
    <section className="page-container py-14 sm:py-16" aria-labelledby="family-section">
      <SectionHeader
        id="family-section"
        eyebrow="Family health"
        title="Care for everyone you look after"
        subtitle="One profile per person — vitals, medications, allergies and upcoming visits, always a tap away."
      />

      <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass overflow-hidden rounded-[28px] p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-white/70">
              <SmartImage
                src={familyProfilesImg}
                alt="A grandparent sharing a morning at home with grandchildren"
                className="h-full w-full"
                fallback={<FamilyImagePlaceholder label="Family profiles in CONNECT" />}
              />
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-bold text-ink-900">
                Health that stays in the family
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Grandparents' blood pressure, a child's vaccination due date, a parent's
                prescription refill — CONNECT keeps each thread separate and easy to follow.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="primary" icon={<HeartPulse className="h-3.5 w-3.5" />}>
                  Vitals at a glance
                </Badge>
                <Badge tone="aqua" icon={<Pill className="h-3.5 w-3.5" />}>
                  Shared medication lists
                </Badge>
                <Badge tone="warn" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                  Appointment reminders
                </Badge>
              </div>

              <Link to="/family" className={buttonClass('primary', 'md', 'mt-6 self-start')}>
                Open family profiles
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {placeholderSlots.map((slot) => (
            <div
              key={slot}
              className="glass flex flex-col gap-4 rounded-3xl border border-dashed border-ink-200 p-5"
            >
              <div className="flex items-center gap-3">
                <Avatar name="?" accent="blue" size="lg" className="opacity-70" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-400">Family member</p>
                  <p className="text-xs text-ink-300">Profile placeholder</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-dashed border-ink-200 bg-white/50 px-3 py-2">
                  <dt className="text-ink-400">Heart rate</dt>
                  <dd className="font-bold text-ink-400">—</dd>
                </div>
                <div className="rounded-xl border border-dashed border-ink-200 bg-white/50 px-3 py-2">
                  <dt className="text-ink-400">Blood pressure</dt>
                  <dd className="font-bold text-ink-400">—</dd>
                </div>
              </dl>

              <p className="mt-auto text-xs font-semibold text-ink-300">
                Reserved for a profile you add
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
