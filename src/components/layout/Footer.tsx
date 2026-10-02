import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const productLinks = [
  { label: 'Baymax AI', to: '/baymax' },
  { label: 'Orayan AI', to: '/orayan' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Health Records', to: '/health-records' },
  { label: 'Medications', to: '/medications' },
];

const companyLinks = [
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/health-education' },
  { label: 'Contact', to: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
];

const socials = [
  {
    label: 'CONNECT on X',
    href: 'https://x.com',
    path: 'M17.53 3H20.5l-6.49 7.41L21.75 21h-5.97l-4.67-6.1L5.7 21H2.72l6.94-7.93L2.25 3h6.12l4.22 5.58L17.53 3zm-1.05 16.2h1.65L7.6 4.71H5.83l10.65 14.49z',
  },
  {
    label: 'CONNECT on Instagram',
    href: 'https://instagram.com',
    path: 'M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 7.57A2.97 2.97 0 1 1 12 9.03a2.97 2.97 0 0 1 0 5.94zM17.8 7.2a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0zM21 7.3c-.05-1.4-.37-2.65-1.4-3.67C18.58 2.6 17.34 2.28 15.94 2.2 14.5 2.12 9.5 2.12 8.06 2.2c-1.4.08-2.63.4-3.66 1.42C3.37 4.65 3.05 5.9 2.97 7.3c-.08 1.44-.08 6.45 0 7.9.05 1.4.37 2.64 1.4 3.66 1.04 1.03 2.27 1.35 3.67 1.43 1.44.08 6.44.08 7.88 0 1.4-.08 2.64-.4 3.67-1.43 1.03-1.02 1.35-2.26 1.4-3.66.08-1.45.08-6.45 0-7.9zm-1.9 9.46c-.3.77-.9 1.37-1.68 1.68-1.16.46-3.92.35-5.42.35s-4.27.1-5.42-.35a2.98 2.98 0 0 1-1.68-1.68c-.46-1.16-.35-3.92-.35-5.42s-.1-4.27.35-5.42A2.98 2.98 0 0 1 6.58 4.3C7.74 3.85 10.5 3.96 12 3.96s4.27-.1 5.42.35c.77.3 1.37.9 1.68 1.67.46 1.16.35 3.92.35 5.42s.11 4.27-.35 5.43z',
  },
  {
    label: 'CONNECT on LinkedIn',
    href: 'https://linkedin.com',
    path: 'M6.94 5a2 2 0 1 1-4-.02 2 2 0 0 1 4 .02zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z',
  },
  {
    label: 'CONNECT on YouTube',
    href: 'https://youtube.com',
    path: 'M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78A26.1 26.1 0 0 0 2 12a26.1 26.1 0 0 0 .42 4.82 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.77A26.1 26.1 0 0 0 22 12a26.1 26.1 0 0 0-.42-4.81zM10 15.02V8.98L15.2 12 10 15.02z',
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/70 bg-white/55 backdrop-blur-md">
      <div className="page-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="CONNECT home">
              <img src="/connect-logo-wide.png" alt="" className="h-9 w-auto rounded-lg object-contain" />
              <span className="text-lg font-extrabold tracking-tight text-ink-900">CONNECT</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
              Your Comprehensive Personal Health Companion — AI-powered insights, organized
              health records, and effortless health management for you and your family.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-primary-100 bg-white/70 text-ink-500 transition hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />

          <div>
            <h3 className="text-sm font-bold text-ink-900">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-600">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                support@connect.health
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                +94 11 245 8890
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                42 Flower Rd, Colombo 07, Sri Lanka
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-6 sm:flex-row">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} CONNECT Health Technologies · All rights reserved
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-xs font-medium text-ink-500 transition hover:text-primary-600"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 rounded-2xl border border-warn-100 bg-warn-50/70 px-4 py-3 text-center text-xs leading-relaxed text-warn-700">
          CONNECT provides general health information and organizational tools. It is not a medical
          device and does not replace professional medical advice, diagnosis or treatment.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-ink-600 transition hover:translate-x-0.5 hover:text-primary-600"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
