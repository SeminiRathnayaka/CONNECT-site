import { Languages } from 'lucide-react';
import type { Language } from '../../lib/api';
import { cn } from '../../utils/cn';

interface LanguageToggleProps {
  value: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
  className?: string;
}

const OPTIONS: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
];

/** English / Sinhala switch shared by Baymax and Orayan. */
export function LanguageToggle({
  value,
  onChange,
  disabled,
  className,
}: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'flex items-center gap-0.5 rounded-full border border-primary-100 bg-white/80 p-0.5 text-[11px] font-bold',
        disabled && 'opacity-50',
        className,
      )}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => onChange(option.code)}
          disabled={disabled}
          aria-pressed={value === option.code}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition',
            value === option.code
              ? 'bg-primary-600 text-white'
              : 'text-ink-500 hover:text-primary-600',
          )}
        >
          <Languages className="h-3 w-3" aria-hidden />
          {option.label}
        </button>
      ))}
    </div>
  );
}