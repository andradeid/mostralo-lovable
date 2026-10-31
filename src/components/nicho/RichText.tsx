import { Fragment, type ReactNode } from 'react';
import type { Rich, RichSpan } from './types';

const renderSpan = (seg: RichSpan, key: number): ReactNode => {
  switch (seg.tag) {
    case 'br':
      return <br key={key} className={seg.className} />;
    case 'year':
      return <Fragment key={key}>{new Date().getFullYear()}</Fragment>;
    case 'strong':
      return <strong key={key} className={seg.className}>{renderRich(seg.text)}</strong>;
    case 'em':
      return <em key={key} className={seg.className}>{renderRich(seg.text)}</em>;
    default:
      return <span key={key} className={seg.className}>{renderRich(seg.text)}</span>;
  }
};

/** Converte um texto `Rich` em nós React (strings e trechos destacados). */
export const renderRich = (text: Rich | undefined | null): ReactNode => {
  if (text === undefined || text === null) return null;
  if (typeof text === 'string') return text;
  return text.map((seg, i) => (typeof seg === 'string' ? <Fragment key={i}>{seg}</Fragment> : renderSpan(seg, i)));
};

export const RichText = ({ text }: { text: Rich | undefined | null }) => <>{renderRich(text)}</>;

/** Texto puro de um `Rich` (para alt, aria-label, PricingText...). */
export const richToString = (text: Rich | undefined | null): string => {
  if (text === undefined || text === null) return '';
  if (typeof text === 'string') return text;
  return text
    .map((seg) => {
      if (typeof seg === 'string') return seg;
      if (seg.tag === 'br') return '\n';
      if (seg.tag === 'year') return String(new Date().getFullYear());
      return richToString(seg.text);
    })
    .join('');
};
