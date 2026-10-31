/** Narração de um artigo: arquivo único e o início (em segundos) de cada trecho do texto. */
export interface ArticleAudio {
  src: string;
  duration: number;
  voice?: string;
  /** target = valor de data-read do trecho na página ("intro", "s1", "s2", …, "mostralo"). */
  segments: { t: number; target: string }[];
}

/** Trecho que está tocando no instante t (o último que já começou). */
export function currentSegment(segments: ArticleAudio["segments"], t: number): string | null {
  let cur: string | null = null;
  for (const s of segments) {
    if (t + 0.05 >= s.t) cur = s.target;
    else break;
  }
  return cur;
}

export const fmtClock = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};
