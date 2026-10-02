import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../utils/cn';

interface IconToggleProps {
  onClick: () => void;
  active: boolean;
  activeClass?: string;
  label: string;
  icon: 'mic' | 'speaker';
  disabled?: boolean;
  className?: string;
}

/** Round icon button used for dictation (mic) and read-aloud (speaker). */
export function VoiceIconButton({
  onClick,
  active,
  activeClass,
  label,
  icon,
  disabled,
  className,
}: IconToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink-200 bg-white/90 text-ink-600 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-45',
        active && (activeClass ?? 'border-primary-400 bg-primary-50 text-primary-600'),
        className,
      )}
    >
      {icon === 'mic' ? (
        active ? (
          <MicOff className="h-4 w-4 animate-pulse-soft" aria-hidden />
        ) : (
          <Mic className="h-4 w-4" aria-hidden />
        )
      ) : active ? (
        <Volume2 className="h-4 w-4 animate-pulse-soft" aria-hidden />
      ) : (
        <VolumeX className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}