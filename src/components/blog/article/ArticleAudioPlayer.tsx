import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, ScrollText } from "lucide-react";
import { currentSegment, fmtClock, type ArticleAudio } from "./articleAudio";

const SPEEDS = [1, 1.25, 1.5] as const;
/** Depois que a pessoa rola a página por conta própria, a página para de acompanhar por um tempo. */
const MANUAL_SCROLL_PAUSE_MS = 8000;

function markReading(target: string | null) {
  document.querySelectorAll("[data-reading='true']").forEach((el) => el.removeAttribute("data-reading"));
  if (target) document.querySelector(`[data-read="${target}"]`)?.setAttribute("data-reading", "true");
}

function scrollToTarget(target: string) {
  const el = document.querySelector(`[data-read="${target}"]`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: "smooth" });
}

/** Ouvir o artigo: o texto vai rolando e o trecho lido fica destacado. Barra fixa embaixo enquanto toca. */
export function ArticleAudioPlayer({ audio }: { audio: ArticleAudio }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [follow, setFollow] = useState(true);
  const current = useRef<string | null>(null);
  const autoScrolling = useRef(0);
  const manualUntil = useRef(0);

  const onTime = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTime(el.currentTime);
    const seg = currentSegment(audio.segments, el.currentTime);
    if (seg === current.current) return;
    current.current = seg;
    markReading(seg);
    // O 1º trecho fica logo abaixo do player: não precisa rolar.
    if (seg && seg !== audio.segments[0]?.target && follow && Date.now() > manualUntil.current) {
      autoScrolling.current = Date.now();
      scrollToTarget(seg);
    }
  }, [audio.segments, follow]);

  // Rolagem feita pela pessoa (roda do mouse, toque, teclado) pausa o acompanhamento por alguns segundos.
  useEffect(() => {
    if (!playing) return;
    const manual = () => { if (Date.now() - autoScrolling.current > 900) manualUntil.current = Date.now() + MANUAL_SCROLL_PAUSE_MS; };
    window.addEventListener("wheel", manual, { passive: true });
    window.addEventListener("touchmove", manual, { passive: true });
    window.addEventListener("keydown", manual);
    return () => {
      window.removeEventListener("wheel", manual);
      window.removeEventListener("touchmove", manual);
      window.removeEventListener("keydown", manual);
    };
  }, [playing]);

  useEffect(() => () => markReading(null), []);
  // A barra fixa não pode cobrir o fim da página.
  useEffect(() => {
    if (!started) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "76px";
    return () => { document.body.style.paddingBottom = prev; };
  }, [started]);
  useEffect(() => { if (ref.current) ref.current.playbackRate = speed; }, [speed]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setStarted(true);
      manualUntil.current = 0;
      void el.play();
    } else el.pause();
  };
  const seek = (v: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = v;
    manualUntil.current = 0;
    current.current = null;
    onTime();
  };
  const nextSpeed = () => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);
  const pct = audio.duration ? Math.min(100, (time / audio.duration) * 100) : 0;
  const minutes = Math.max(1, Math.round(audio.duration / 60));

  const controls = (compact: boolean) => (
    <div className="flex w-full items-center gap-3">
      <button type="button" onClick={toggle} aria-label={playing ? "Pausar narração" : "Ouvir o artigo"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90">
        {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        {!compact && <p className="text-sm font-bold text-foreground">Ouvir este artigo · {minutes} min</p>}
        <input type="range" min={0} max={audio.duration} step={0.5} value={time} onChange={(e) => seek(Number(e.target.value))}
          aria-label="Posição da narração" className="mt-1 w-full accent-[hsl(var(--primary))]" style={{ backgroundSize: `${pct}% 100%` }} />
        <p className="text-xs text-muted-foreground">{fmtClock(time)} / {fmtClock(audio.duration)}</p>
      </div>
      <button type="button" onClick={nextSpeed} aria-label="Velocidade da narração"
        className="h-8 shrink-0 rounded-full border border-border px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground">{speed}x</button>
      <button type="button" onClick={() => setFollow((f) => !f)} aria-pressed={follow} title="A página rola junto com a narração"
        className={`hidden h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold sm:inline-flex ${follow ? "border-primary/60 text-primary" : "border-border text-muted-foreground"}`}>
        <ScrollText className="h-3.5 w-3.5" /> Acompanhar
      </button>
    </div>
  );

  return (
    <>
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Headphones className="h-4 w-4" /> Versão em áudio</div>
        {controls(false)}
        <p className="mt-2 text-xs text-muted-foreground">Enquanto toca, a página rola e destaca o trecho que está sendo lido. Se você rolar por conta própria, ela espera um pouco antes de voltar a acompanhar.</p>
      </div>
      {started && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-2 backdrop-blur md:px-6" role="region" aria-label="Player da narração">
          <div className="mx-auto max-w-3xl">{controls(true)}</div>
        </div>
      )}
      <audio ref={ref} src={audio.src} preload="none" onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); markReading(null); current.current = null; }} />
    </>
  );
}
