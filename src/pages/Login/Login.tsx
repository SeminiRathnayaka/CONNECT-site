import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormControls';

type Mode = 'signin' | 'signup';

const MIN_PASSWORD = 8;

export default function Login() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (mode === 'signup' && name.trim().length < 2) {
      next.name = 'Please enter your full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    // Matches the server rule, so the same message is shown in both places.
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      next.password = `Please use a password of at least ${MIN_PASSWORD} characters.`;
    } else if (mode === 'signin' && password.length < 1) {
      next.password = 'Please enter your password.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      if (mode === 'signup') await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);

      // Never keep the password in component state after a successful sign-in.
      setPassword('');
      toast(mode === 'signup' ? 'Welcome to CONNECT!' : 'Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const message = errorMessage(error, 'Could not sign you in. Please try again.');
      setErrors({ password: message });
      toast(message, 'warning');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <p className="text-sm text-ink-500">Checking your session…</p>
      </div>
    );
  }

  /* ----- already signed in ----- */
  if (user) {
    return (
      <div className="page-container flex justify-center py-12 sm:py-20">
        <div className="glass-tint w-full max-w-md rounded-[28px] p-7 text-center sm:p-9">
          <Avatar name={user.name} initials={user.initials} size="xl" className="mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-ink-900">You're signed in</h1>
          <p className="mt-1 text-sm text-ink-600">
            {user.name} · {user.email}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link to="/dashboard" className={buttonClass('primary', 'md')}>
              Open my dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/family" className={buttonClass('secondary', 'md')}>
              Family profiles
            </Link>
            <button
              type="button"
              className={buttonClass('ghost', 'md')}
              onClick={() => {
                void signOut();
                toast('Signed out.', 'info');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ----- sign in / sign up ----- */
  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-aqua-600 p-9 text-white lg:flex">
          <span className="absolute -top-16 -left-14 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
          <span className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-aqua-300/25 blur-2xl" />

          <Link to="/" className="relative flex items-center gap-2.5" aria-label="CONNECT home">
            <span className="grid h-9 place-items-center overflow-hidden rounded-xl bg-white/20 px-1.5">
              <img src="/connect-logo-wide.png" alt="" className="h-8 w-auto object-contain" />
            </span>
            <span className="text-lg font-extrabold">CONNECT</span>
          </Link>

          <div className="relative">
            <h2 className="text-2xl leading-snug font-bold text-white">
              Your Comprehensive
              <br />
              Personal Health Companion
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              AI-powered insights, organized health records, and effortless health management for
              you and your family.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                { icon: Sparkles, text: 'Baymax AI health conversations' },
                { icon: ShieldCheck, text: 'Orayan report explanations in English & Sinhala' },
                { icon: LockKeyhole, text: 'Password-protected account, history kept private to you' },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-white/90">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/20">
                    <b.icon className="h-4 w-4" aria-hidden />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/60">
            © {new Date().getFullYear()} CONNECT
          </p>
        </div>

        {/* Form panel */}
        <div className="glass-strong p-7 sm:p-9">
          <div className="mb-6 inline-flex rounded-full border border-ink-200 bg-white/70 p-1">
            {(
              [
                { key: 'signin', label: 'Sign in' },
                { key: 'signup', label: 'Create account' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setMode(t.key);
                  setErrors({});
                }}
                className={
                  mode === t.key
                    ? 'rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm'
                    : 'rounded-full px-4 py-2 text-sm font-bold text-ink-500 transition hover:text-primary-600'
                }
                aria-pressed={mode === t.key}
              >
                {t.label}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-bold text-ink-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your CONNECT account'}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {mode === 'signin'
              ? 'Sign in to continue to your health companion.'
              : 'Set up your personal health space in seconds.'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
            {mode === 'signup' ? (
              <div>
                <Input
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  autoComplete="name"
                  icon={<UserIcon className="h-4 w-4" />}
                />
                {errors.name ? <FieldError message={errors.name} /> : null}
              </div>
            ) : null}

            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
              />
              {errors.email ? <FieldError message={errors.email} /> : null}
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`At least ${MIN_PASSWORD} characters`}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  icon={<LockKeyhole className="h-4 w-4" />}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 bottom-2.5 p-1 text-ink-400 transition hover:text-primary-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <FieldError message={errors.password} /> : null}
            </div>

            <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              {!busy ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="font-semibold text-primary-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-primary-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 text-xs font-medium text-alert-600" role="alert">
      {message}
    </p>
  );
}
