import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Siren,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { NotificationBell } from './NotificationBell';
import { Avatar } from '../ui/Avatar';
import { buttonClass } from '../ui/Button';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Features', to: '/#features' },
  { label: 'Baymax AI', to: '/baymax' },
  { label: 'Orayan AI', to: '/orayan' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Health Records', to: '/health-records' },
  { label: 'Family', to: '/family' },
  { label: 'Blog', to: '/health-education' },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const isActive = (to: string) =>
    to.startsWith('/#')
      ? location.pathname === '/' && location.hash === to.slice(1)
      : location.pathname === to;

  const handleSignOut = () => {
    signOut();
    setProfileOpen(false);
    toast('Signed out successfully.', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5',
          scrolled ? 'glass-strong shadow-[0_10px_40px_-24px_rgba(16,35,58,0.5)]' : 'glass',
        )}
      >
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5" aria-label="CONNECT home">
          <img
            src="/connect-logo-wide.png"
            alt=""
            className="h-9 w-auto rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            CONNECT
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200',
                  isActive(item.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-ink-600 hover:bg-white/70 hover:text-primary-700',
                )}
                aria-current={isActive(item.to) ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          {!user ? (
            <Link to="/login" className={buttonClass('primary', 'sm', 'hidden sm:inline-flex')}>
              Login
            </Link>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 py-1 pr-2 pl-1 transition hover:bg-white"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open account menu"
              >
                <Avatar name={user.name} initials={user.initials} size="sm" />
                <span className="hidden text-sm font-semibold text-ink-700 sm:block">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-ink-400 transition-transform duration-200',
                    profileOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>

              {profileOpen ? (
                <div
                  role="menu"
                  className="glass-strong absolute right-0 mt-2 w-60 origin-top-right animate-pop-in rounded-2xl p-2"
                >
                  <div className="border-b border-ink-100 px-3 pt-1 pb-3">
                    <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                  <MenuLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </MenuLink>
                  <MenuLink to="/family" icon={<User className="h-4 w-4" />}>
                    Family profiles
                  </MenuLink>
                  <MenuLink to="/emergency" icon={<Siren className="h-4 w-4" />}>
                    Emergency access
                  </MenuLink>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-alert-600 transition hover:bg-alert-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/70 bg-white/60 text-ink-700 transition hover:bg-white lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      <div
        className={cn(
          'mx-auto max-w-7xl overflow-hidden transition-all duration-300 ease-out lg:hidden',
          menuOpen ? 'mt-2 max-h-[70vh] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="glass-strong max-h-[70vh] overflow-y-auto rounded-2xl p-3">
          <ul className="flex flex-col gap-1">
            {navItems.map((item, i) => (
              <li
                key={item.to}
                className="transition-transform duration-300"
                style={{
                  transitionDelay: `${i * 30}ms`,
                  transform: menuOpen ? 'translateX(0)' : 'translateX(-8px)',
                }}
              >
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition',
                    isActive(item.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-700 hover:bg-white/80',
                  )}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {!user ? (
            <Link to="/login" className={buttonClass('primary', 'md', 'mt-2 w-full')}>
              Login / Sign up
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className={buttonClass('secondary', 'md', 'mt-2 w-full')}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-primary-50 hover:text-primary-700"
    >
      <span className="text-primary-500">{icon}</span>
      {children}
    </Link>
  );
}
