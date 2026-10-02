import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';

interface FieldShellProps {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, hint, htmlFor, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, hint, className, id, icon, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const input = icon ? (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400">
        {icon}
      </span>
      <input id={inputId} className={cn('field pl-10', className)} {...rest} />
    </div>
  ) : (
    <input id={inputId} className={cn('field', className)} {...rest} />
  );
  if (!label) return input;
  return (
    <FieldShell label={label} hint={hint} htmlFor={inputId}>
      {input}
    </FieldShell>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const area = <textarea id={areaId} className={cn('field min-h-24 resize-y', className)} {...rest} />;
  if (!label) return area;
  return (
    <FieldShell label={label} hint={hint} htmlFor={areaId}>
      {area}
    </FieldShell>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, hint, className, id, options, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const select = (
    <select id={selectId} className={cn('field appearance-none', className)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return (
    <FieldShell label={label} hint={hint} htmlFor={selectId}>
      {select}
    </FieldShell>
  );
}
