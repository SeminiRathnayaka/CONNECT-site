import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { buttonClass } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import {
  FamilyImagePlaceholder,
  SmartImage,
} from '../../../components/images/Placeholders';
import familyHeroImg from '../../../assets/images/family-hero.jpg';

const chips = [
  'Ask health questions with AI',
  "Keep your family's health organized",
  'Your information stays private',
];

export function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="page-container pt-8 pb-4 sm:pt-12" aria-labelledby="hero-title">
      <div className="glass-tint relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-12">
        <span className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl" />
        <span className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-aqua-200/40 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Copy */}
          <div className="animate-fade-up">
            <h1
              id="hero-title"
              className="text-3xl leading-[1.12] font-extrabold text-ink-900 sm:text-4xl lg:text-[2.9rem]"
            >
              Health care, <span className="text-gradient-blue">made easier</span> for you and
              your family.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              Keep your health information, reports, medicines, appointments, and family members
              in one simple place.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
              Ask questions when you’re unsure. Understand your medical reports without all the
              complicated words. Keep track of the people you care about. All from one calm
              space.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className={buttonClass('primary', 'lg')}
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                Get Started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <a href="#features" className={buttonClass('secondary', 'lg')}>
                Explore Features
              </a>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {chips.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-600"
                >
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-ok-100 text-ok-600">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(16,35,58,0.5)] ring-1 ring-white/80">
              <div className="aspect-[4/3] w-full sm:aspect-[16/11]">
                <SmartImage
                  src={familyHeroImg}
                  alt="Three generations of a family smiling together at home"
                  className="h-full w-full"
                  fallback={
                    <FamilyImagePlaceholder label="Six generations of care, one calm place" />
                  }
                />
              </div>
            </div>

            <Link
              to="/baymax"
              className="glass-strong absolute right-3 -bottom-6 hidden items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-primary-700 transition hover:-translate-y-0.5 md:flex"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Ask Baymax AI
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
