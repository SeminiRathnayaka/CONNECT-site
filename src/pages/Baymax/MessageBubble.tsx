import { Bot, ShieldAlert } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { cn } from '../../utils/cn';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 animate-fade-up', isUser && 'flex-row-reverse')}>
      {!isUser ? (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-aqua-400 to-aqua-600 text-white shadow-sm">
          <Bot className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <div className={cn('max-w-[85%] sm:max-w-[75%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-left text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-[0_12px_26px_-18px_rgba(37,99,235,0.9)]'
              : 'rounded-tl-sm bg-white/85 text-ink-700 ring-1 ring-ink-100',
          )}
        >
          <span className="whitespace-pre-line">{message.content}</span>
        </div>
        <p className="mt-1 px-1 text-[11px] text-ink-400">
          {isUser ? 'You' : 'Baymax'} · {message.timestamp}
        </p>
      </div>
    </div>
  );
}

export function EmergencyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-alert-100 bg-alert-50 px-4 py-3 animate-pop-in">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-alert-600" aria-hidden />
      <div className="text-sm">
        <p className="font-bold text-alert-700">This may need urgent attention</p>
        <p className="mt-0.5 leading-relaxed text-alert-700/90">
          If symptoms are severe or sudden, contact your local emergency services now. Baymax
          cannot assess emergencies through chat.
        </p>
      </div>
    </div>
  );
}
