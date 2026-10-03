/**
 * Minimal, safe renderer for the light markdown that Orayan is asked to produce.
 *
 * Orayan's summaries and explanations use a fixed, small set of constructs:
 * `##` headings, `**bold**` labels and `-`/`*` bullets. Rather than pull in a
 * markdown library, this handles exactly those and renders them as real React
 * elements, so model output can never inject HTML.
 */
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Block =
  | { kind: 'heading'; text: string; level: number }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

function isBullet(line: string) {
  return /^\s*[-*•]\s+/.test(line);
}

/** Splits raw text into headings, paragraphs and bullet lists. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let buffer: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    const joined = buffer.join('\n').trim();
    if (joined) blocks.push({ kind: 'paragraph', text: joined });
    buffer = [];
  };

  const flushList = () => {
    if (list.length) blocks.push({ kind: 'list', items: list });
    list = [];
  };

  for (const line of lines) {
    const heading = /^(#{1,4})\s+(.*)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: 'heading',
        text: heading[2].trim(),
        level: Math.min(heading[1].length, 3),
      });
      continue;
    }

    if (isBullet(line)) {
      flushParagraph();
      list.push(line.replace(/^\s*[-*•]\s+/, '').trim());
      continue;
    }

    flushList();
    // A blank line ends the current paragraph; otherwise keep collecting so
    // single newlines inside a block survive.
    if (!line.trim()) {
      flushParagraph();
    } else {
      buffer.push(line);
    }
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Renders inline `**bold**` and `` `code` `` as elements, not HTML. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b${index}`} className="font-bold text-ink-900">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-c${index}`}
          className="rounded bg-ink-100 px-1 py-0.5 text-[0.9em] text-ink-800"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function ReportMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = toBlocks(text);

  return (
    <div className={cn('space-y-3', className)}>
      {blocks.map((block, i) => {
        const key = `b${i}`;

        if (block.kind === 'heading') {
          const size =
            block.level === 1
              ? 'text-base font-extrabold text-ink-900 mt-5 first:mt-0'
              : block.level === 2
                ? 'text-sm font-extrabold text-ink-900 mt-5 first:mt-0'
                : 'text-xs font-bold uppercase tracking-wide text-primary-600 mt-4 first:mt-0';
          return (
            <p key={key} className={size}>
              {renderInline(block.text, key)}
            </p>
          );
        }

        if (block.kind === 'list') {
          return (
            <ul key={key} className="space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                  <span aria-hidden className="text-primary-500">
                    &bull;
                  </span>
                  <span className="min-w-0">{renderInline(item, `${key}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={key} className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}