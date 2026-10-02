import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { buttonClass } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

const placeholderSlots = [0, 1, 2];

export function SocialProof() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <section className="page-container py-14 sm:py-16" aria-labelledby="testimonials-title">
        <SectionHeader
          id="testimonials-title"
          eyebrow="Testimonials"
          title="Real Stories, Real Health"
          subtitle="What people say about CONNECT."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {placeholderSlots.map((slot) => (
            <figure
              key={slot}
              className="glass flex h-full flex-col gap-4 rounded-3xl border-2 border-dashed border-ink-200 bg-white/50 p-6 animate-fade-up"
              style={{ animationDelay: `${slot * 70}ms` }}
            >
              <Quote className="h-6 w-6 text-ink-300" aria-hidden />
              <blockquote className="text-sm italic leading-relaxed text-ink-500">
                Reserved for a customer story.
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-ink-100 pt-4">
                <Avatar name="—" initials="—" size="sm" />
                <div>
                  <p className="text-sm font-bold text-ink-900">To be shared</p>
                  <p className="text-xs text-ink-500">Coming soon</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="page-container pb-6 pt-4" aria-labelledby="cta-title">
        <div className="glass-tint relative overflow-hidden rounded-[32px] px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="absolute -top-20 left-1/4 h-56 w-56 rounded-full bg-primary-200/50 blur-3xl" />
          <span className="absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-aqua-200/50 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-title"
              className="text-2xl leading-tight font-extrabold text-ink-900 sm:text-4xl"
            >
              Take Control of Your Health Journey Today
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
              Create your CONNECT account and bring your records, medications and family's care into
              one calm, organized space.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className={buttonClass('primary', 'lg')}
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {user ? 'Open my dashboard' : 'Sign Up Now'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <Link to="/#features" className={buttonClass('secondary', 'lg')}>
                Explore CONNECT
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
