import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Home, LayoutDashboard } from 'lucide-react';
import { buttonClass } from '../../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-container flex min-h-[62vh] items-center justify-center py-12">
      <div className="glass-tint w-full max-w-xl rounded-[32px] p-8 text-center sm:p-12">
        <div className="relative mx-auto mb-6 h-28 w-36">
          <span className="absolute top-2 left-1/2 h-24 w-7 -translate-x-1/2 rounded-full bg-primary-300/70" />
          <span className="absolute top-1/2 left-1/2 h-7 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua-300/70" />
          <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold text-white drop-shadow">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-600">
          The page you are looking for does not exist or may have been moved. Let's get you back
          to a familiar place.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className={buttonClass('primary', 'md')}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Go back
          </button>
          <Link to="/" className={buttonClass('secondary', 'md')}>
            <Home className="h-4 w-4" aria-hidden />
            Home
          </Link>
          <Link to="/dashboard" className={buttonClass('soft', 'md')}>
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>
          <Link to="/#features" className={buttonClass('ghost', 'md')}>
            <Compass className="h-4 w-4" aria-hidden />
            Explore features
          </Link>
        </div>
      </div>
    </div>
  );
}
