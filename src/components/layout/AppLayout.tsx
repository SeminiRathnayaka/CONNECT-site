import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ParticleField } from './ParticleField';

/** Smoothly handles `#hash` navigation (e.g. `/#features`) and resets scroll on route change. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const timer = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0 });
        }
      }, 60);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0 });
    return undefined;
  }, [pathname, hash]);

  return null;
}

export function AppLayout() {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.hash}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]"
      >
        Skip to content
      </a>

      <ParticleField />

      <ScrollManager />
      <Navbar />

      <main id="main-content" className="flex-1">
        <div key={pageKey} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
