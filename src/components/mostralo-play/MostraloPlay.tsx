import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  episodeThumb,
  useThumbsReady,
  fmtClock,
  fmtMin,
  nextToWatch,
  orderedEpisodes,
  progressPct,
  useMostraloPlayCatalog,
  type PlayCatalog,
  type PlayEpisode,
} from "./catalog";
import { MostraloPlayPlayer } from "./MostraloPlayPlayer";
import "./mostralo-play.css";

const SERIES_TITLE = "Domine o Mostralo, da loja pronta à primeira venda";
const SERIES_DESC =
  "Tutoriais curtos para montar sua loja, receber pedidos, organizar a agenda e vender mais — sem comissão de marketplace. Assista na ordem ou vá direto ao que você precisa.";
const INTRO_KEY = "mostralo-play:intro-visto";
const INTRO_SOUND = "/mostralo-play/intro.mp3"; // som da abertura (sintetizado; sincronizado com a animação)

function firstName(full?: string | null) {
  return (
    String(full ?? "")
      .trim()
      .split(/\s+/)[0] || ""
  );
}

// Símbolo do Mostralo: a lojinha com toldo e o reloginho.
const STORE_BODY = [
  "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",
  "M4 12v8a2 2 0 0 0 2 2h9",
  "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4",
  "M2 7h20",
];
const STORE_AWNING =
  "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7";

function Mini() {
  return (
    <svg className="mp-mini" viewBox="0 0 24 24" fill="none" stroke="#f07a2b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {STORE_BODY.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={STORE_AWNING} />
    </svg>
  );
}

/** Abertura: a lojinha se desenha, o toldo laranja aparece, a porta acende nas batidas e o reloginho gira. */
function IntroStore() {
  return (
    <svg className="mp-store" viewBox="-1 -1 26 26" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <linearGradient id="mp-g-intro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb547" />
          <stop offset="100%" stopColor="#f07a2b" />
        </linearGradient>
      </defs>
      <path className="door" d="M9.2 22v-4a1.8 1.8 0 0 1 1.8-1.8h2a1.8 1.8 0 0 1 1.8 1.8v4z" stroke="none" />
      <g className="glow" stroke="url(#mp-g-intro)" strokeWidth="3.2">
        {STORE_BODY.map((d) => (
          <path key={d} d={d} />
        ))}
        <path d={STORE_AWNING} />
      </g>
      {STORE_BODY.map((d) => (
        <path key={d} className="body" d={d} stroke="#fff4ea" strokeWidth="1.6" pathLength={1} />
      ))}
      <path className="awning" d={STORE_AWNING} stroke="url(#mp-g-intro)" strokeWidth="1.8" pathLength={1} />
      <g className="clock">
        <circle cx="19.5" cy="19.5" r="4.2" fill="#0e0a07" stroke="#f07a2b" strokeWidth="1.5" />
        <path className="hand" d="M19.5 17.3v2.2l1.5 1" stroke="#f07a2b" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

function EpisodeCard({
  ep,
  cat,
  onOpen,
  onPlay,
  trackTitle,
}: {
  ep: PlayEpisode;
  cat: PlayCatalog;
  onOpen: (e: PlayEpisode) => void;
  onPlay: (e: PlayEpisode) => void;
  trackTitle: string;
}) {
  const pct = progressPct(ep, cat.progress[ep.id]);
  const soon = !ep.video_id;
  return (
    <button
      type="button"
      className="mp-card"
      onClick={() => onOpen(ep)}
      aria-label={`Episódio ${ep.number}: ${ep.title}`}
    >
      <div className="mp-thumb" style={{ backgroundImage: `url(${episodeThumb(ep)})` }}>
        <span className="ep">EP. {ep.number}</span>
        {soon && <span className="soon">EM BREVE</span>}
        <span className="t">{ep.title}</span>
        {pct > 0 && pct < 100 && (
          <span className="mp-pg">
            <i style={{ width: `${pct}%` }} />
          </span>
        )}
      </div>
      <div className="mp-pop">
        <div className="ic">
          <span
            className="w"
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!soon) onPlay(ep);
            }}
          >
            ▶
          </span>
          <span>{pct === 100 ? "✓" : "+"}</span>
          <span>⌄</span>
        </div>
        <b>{ep.title}</b>
        <small>
          {pct === 100 && <span className="mp-ok">✓ Assistido · </span>}
          {soon ? "Em breve" : fmtClock(ep.duration_seconds)} · {trackTitle}
        </small>
      </div>
    </button>
  );
}

function DetailDialog({
  ep,
  cat,
  onClose,
  onPlay,
}: {
  ep: PlayEpisode;
  cat: PlayCatalog;
  onClose: () => void;
  onPlay: (e: PlayEpisode) => void;
}) {
  const track = cat.tracks.find((t) => t.id === ep.track_id);
  const eps = orderedEpisodes(cat).filter((e) => e.track_id === ep.track_id);
  const done = eps.filter((e) => cat.progress[e.id]?.completed).length;
  const pct = progressPct(ep, cat.progress[ep.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="mp-ov"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal
      aria-label={ep.title}
    >
      <div className="mp-det">
        <div className="mp-dh" style={{ backgroundImage: `url(${episodeThumb(ep)})` }}>
          <button type="button" className="mp-x" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
          <div className="c">
            <h3>{ep.title}</h3>
            <div className="mp-btns">
              <button
                type="button"
                className="mp-play"
                disabled={!ep.video_id}
                onClick={() => onPlay(ep)}
              >
                ▶{" "}
                {!ep.video_id
                  ? "Em breve"
                  : pct > 0 && pct < 100
                    ? "Continuar"
                    : pct === 100
                      ? "Assistir de novo"
                      : "Assistir"}
              </button>
            </div>
          </div>
        </div>
        <div className="mp-db">
          <div>
            <div className="mp-meta">
              <span className="m">{pct === 100 ? "✓ Assistido" : "Novo para você"}</span>
              <span>Ep. {ep.number}</span>
              <span>{fmtClock(ep.duration_seconds)}</span>
              <span className="hd">HD</span>
            </div>
            <p>{ep.description}</p>
          </div>
          <div className="side">
            <b>Trilha:</b> {track?.title}
            <br />
            <b>Progresso:</b> {done} de {eps.length} episódios
            <br />
            <b>Série:</b> {SERIES_TITLE.replace(",", "")}
          </div>
        </div>
        <div className="mp-eps">
          <h4>
            {track?.title} <small>{eps.length} episódios</small>
          </h4>
          {eps.map((e) => {
            const p = progressPct(e, cat.progress[e.id]);
            return (
              <button
                type="button"
                key={e.id}
                className={`mp-er ${e.id === ep.id ? "cur" : ""}`}
                onClick={() => (e.video_id ? onPlay(e) : undefined)}
              >
                <span className="n">{e.number}</span>
                <div className="tb" style={{ backgroundImage: `url(${episodeThumb(e)})` }}>
                  {p > 0 && (
                    <span className="mp-pg">
                      <i style={{ width: `${p}%` }} />
                    </span>
                  )}
                </div>
                <div>
                  <b>{e.title}</b>
                  <p>{e.video_id ? e.description : "Em breve"}</p>
                </div>
                <span className="d">{fmtMin(e.duration_seconds)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MostraloPlay() {
  useThumbsReady();
  const { user, profile } = useAuth();
  const fullName = profile?.full_name ?? null;
  const navigate = useNavigate();
  const { data: cat, isLoading, error } = useMostraloPlayCatalog(user?.id);
  const scroller = useRef<HTMLDivElement>(null);
  const [solid, setSolid] = useState(false);
  // Abertura: "wait" = preparando o som; "tap" = navegador bloqueou o som, pede um toque;
  // "show" = som e animação começam juntos; "hide" = sumindo; "off" = já vista nesta sessão.
  const [intro, setIntro] = useState<"wait" | "tap" | "show" | "hide" | "off">(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(INTRO_KEY)
        ? "off"
        : "wait";
    } catch {
      return "off";
    }
  });
  const audio = useRef<{ ctx: AudioContext; buf: AudioBuffer | null } | null>(null);
  const [detail, setDetail] = useState<PlayEpisode | null>(null);
  const [playing, setPlaying] = useState<PlayEpisode | null>(null);

  useEffect(() => {
    if (intro !== "show") return;
    const a = window.setTimeout(() => setIntro("hide"), 2700);
    const b = window.setTimeout(() => {
      setIntro("off");
      try {
        window.sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* sem storage */
      }
    }, 3500);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [intro]);

  // Prepara o som da abertura; a animação só começa quando o som puder tocar junto.
  useEffect(() => {
    if (intro !== "wait") return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) {
      setIntro("show");
      return;
    }
    const ctx = new AC();
    const wait = <T,>(p: Promise<T>, ms: number, fb: T) =>
      Promise.race([p, new Promise<T>((r) => window.setTimeout(() => r(fb), ms))]);
    const buf = wait(
      fetch(INTRO_SOUND)
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null),
      3000,
      null,
    );
    const running = wait(
      ctx
        .resume()
        .then(() => ctx.state === "running")
        .catch(() => false),
      700,
      false,
    );
    Promise.all([buf, running]).then(([b, ok]) => {
      if (cancelled) return;
      audio.current = { ctx, buf: b };
      if (!b) setIntro("show"); // som não carregou: abre sem som para não travar
      else if (ok) startIntro();
      else setIntro("tap");
    });
    return () => {
      cancelled = true;
      if (!audio.current) void ctx.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro]);

  function startIntro() {
    const a = audio.current;
    if (!a?.buf) return setIntro("show");
    const src = a.ctx.createBufferSource();
    const g = a.ctx.createGain();
    g.gain.value = 0.6;
    src.buffer = a.buf;
    src.connect(g).connect(a.ctx.destination);
    const lead = 0.06;
    src.start(a.ctx.currentTime + lead);
    src.onended = () => void a.ctx.close().catch(() => {});
    window.setTimeout(() => setIntro("show"), lead * 1000);
  }
  const tapToEnter = () => {
    const a = audio.current;
    if (!a) return setIntro("show");
    a.ctx
      .resume()
      .catch(() => {})
      .finally(startIntro);
  };

  const eps = useMemo(() => (cat ? orderedEpisodes(cat) : []), [cat]);
  const cont = cat ? nextToWatch(cat) : null;
  const started = cat
    ? eps.filter((e) => {
        const p = cat.progress[e.id];
        return p && !p.completed && p.position_seconds > 5;
      })
    : [];
  const continueRow = cont ? eps.slice(eps.indexOf(cont), eps.indexOf(cont) + 4) : [];
  const totalMin = Math.round(eps.reduce((s, e) => s + e.duration_seconds, 0) / 60);
  const nome = firstName(fullName);
  const trackTitle = (id: string) => cat?.tracks.find((t) => t.id === id)?.title ?? "";
  const initials = (fullName || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const play = (ep: PlayEpisode) => {
    setDetail(null);
    if (!ep.video_id) return;
    // Abre em tela cheia já no clique (o navegador só permite dentro do clique do usuário).
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    } catch {
      /* iPhone não tem fullscreen de página: segue na tela normal */
    }
    setPlaying(ep);
  };
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [title1, title2] = SERIES_TITLE.split(",");

  return (
    <div
      className="mp"
      ref={scroller}
      onScroll={(e) => setSolid((e.currentTarget.scrollTop ?? 0) > 60)}
    >
      {intro !== "off" && (
        <div className={`mp-intro ${intro === "hide" ? "hide" : ""}`} aria-hidden={intro !== "tap"}>
          {(intro === "show" || intro === "hide") && (
            <>
              <IntroStore />
              <div className="mp-word">
                Mostralo<small>PLAY</small>
              </div>
            </>
          )}
          {intro === "tap" && (
            <button type="button" className="mp-enter" onClick={tapToEnter} autoFocus>
              <i>▶</i>
              <span>Entrar no Mostralo Play</span>
            </button>
          )}
        </div>
      )}

      <nav className={`mp-nav ${solid ? "solid" : ""}`}>
        <div className="mp-logo">
          Mostralo<b>PLAY</b>
        </div>
        <a
          className="on"
          onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Início
        </a>
        <a onClick={() => scrollTo("mp-trilhas")}>Trilhas</a>
        {started.length > 0 && <a onClick={() => scrollTo("mp-cont")}>Continuar assistindo</a>}
        <div className="mp-right">
          {profile?.user_type === "master_admin" && (
            <button type="button" className="mp-pill" onClick={() => navigate("/dashboard/tutorials-management")}>
              Gerenciar tutoriais
            </button>
          )}
          <button type="button" className="mp-back" onClick={() => navigate("/dashboard")}>
            ← <span className="full">Voltar para o painel</span>
            <span className="short">Voltar</span>
          </button>
          <span className="mp-av" title={fullName ?? user?.email ?? ""}>
            {initials}
          </span>
        </div>
      </nav>

      {isLoading && <div className="mp-empty">Carregando…</div>}
      {error && (
        <div className="mp-empty">
          Não foi possível carregar o Mostralo Play agora. Tente de novo em instantes.
        </div>
      )}

      {cat && (
        <>
          <section className="mp-bill">
            <div className="mp-glow" />
            <div
              className="mp-shot mp-s2"
              style={{ backgroundImage: "url(/mostralo-play/hero-2.jpg)" }}
            />
            <div
              className="mp-shot mp-s1"
              style={{ backgroundImage: "url(/mostralo-play/hero-1.jpg)" }}
            />
            <div className="mp-bc">
              <div className="mp-orig">
                <Mini />
                SÉRIE ORIGINAL MOSTRALO
              </div>
              <h1>
                {title1.replace(/Mostralo/, "")}
                {title1.includes("Mostralo") && <em>Mostralo</em>}
                {title2 && (
                  <>
                    ,<br />
                    {title2.trim()}
                  </>
                )}
              </h1>
              <div className="mp-meta">
                <span className="m">Novo</span>
                <span>2026</span>
                <span>{eps.length} episódios</span>
                <span>{totalMin >= 120 ? `${Math.round(totalMin / 60)} h de conteúdo` : `${totalMin} min`}</span>
                <span className="hd">HD</span>
              </div>
              <p>{SERIES_DESC}</p>
              <div className="mp-btns">
                {cont && (
                  <button
                    type="button"
                    className="mp-play"
                    disabled={!cont.video_id}
                    onClick={() => play(cont)}
                  >
                    ▶{" "}
                    {!cont.video_id
                      ? "Em breve"
                      : started.some((s) => s.id === cont.id)
                        ? `Continuar · Ep. ${cont.number}`
                        : cont.number === 1
                          ? "Assistir"
                          : `Assistir · Ep. ${cont.number}`}
                  </button>
                )}
                {eps[0] && (
                  <button
                    type="button"
                    className="mp-more"
                    onClick={() => setDetail(cont ?? eps[0])}
                  >
                    ⓘ Mais informações
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="mp-rows">
            {started.length > 0 && continueRow.length > 0 && (
              <div className="mp-row" id="mp-cont">
                <h2>
                  Continuar assistindo{nome ? `, ${nome}` : ""}{" "}
                  <small>você parou no episódio {cont?.number}</small>
                </h2>
                <div className="mp-track">
                  {continueRow.map((e) => (
                    <EpisodeCard
                      key={e.id}
                      ep={e}
                      cat={cat}
                      onOpen={setDetail}
                      onPlay={play}
                      trackTitle={trackTitle(e.track_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {eps.length >= 3 && (
              <div className="mp-row mp-top3">
                <h2>
                  Os 3 primeiros passos <small>comece por aqui</small>
                </h2>
                <div className="mp-track">
                  {eps.slice(0, 3).map((e, i) => (
                    <button
                      type="button"
                      key={e.id}
                      className="mp-card"
                      onClick={() => setDetail(e)}
                    >
                      <span className="mp-big" aria-hidden>
                        {i + 1}
                      </span>
                      <div
                        className="mp-thumb"
                        style={{ backgroundImage: `url(${episodeThumb(e)})` }}
                      >
                        <span className="ep">EP. {e.number}</span>
                        <span className="t">{e.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div id="mp-trilhas">
              {cat.tracks.map((t) => {
                const list = eps.filter((e) => e.track_id === t.id);
                if (!list.length) return null;
                const done = list.filter((e) => cat.progress[e.id]?.completed).length;
                return (
                  <div className="mp-row" key={t.id}>
                    <h2>
                      {t.title}{" "}
                      <small>
                        {done}/{list.length} assistidos
                      </small>
                    </h2>
                    <div className="mp-track">
                      {list.map((e) => (
                        <EpisodeCard
                          key={e.id}
                          ep={e}
                          cat={cat}
                          onOpen={setDetail}
                          onPlay={play}
                          trackTitle={t.title}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {eps.length === 0 && (
              <div className="mp-empty">Os episódios estão chegando. Volte em breve.</div>
            )}
          </div>
        </>
      )}

      {detail && cat && (
        <DetailDialog ep={detail} cat={cat} onClose={() => setDetail(null)} onPlay={play} />
      )}
      {playing && cat && (
        <MostraloPlayPlayer
          ep={playing}
          cat={cat}
          onClose={() => setPlaying(null)}
          onNext={(n) => setPlaying(n)}
        />
      )}
    </div>
  );
}
