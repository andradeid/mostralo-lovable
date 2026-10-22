// Mostralo Play — área de tutoriais estilo streaming.
// Usa as mesmas tabelas da Central de Aprendizado (tutorials, tutorial_categories, tutorial_views):
// nada novo no banco. Aqui só montamos o "catálogo" (trilhas → episódios numerados).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PlayTrack {
  id: string;
  title: string;
}

export interface PlayEpisode {
  id: string;
  track_id: string;
  number: number;
  title: string;
  description: string;
  duration_seconds: number;
  video_id: string | null;
  thumbnail_url: string | null;
}

export interface PlayProgress {
  episode_id: string;
  position_seconds: number;
  completed: boolean;
  updated_at: string;
}

export interface PlayCatalog {
  tracks: PlayTrack[];
  episodes: PlayEpisode[];
  progress: Record<string, PlayProgress>;
}

export const PLAY_KEYS = { catalog: (uid?: string) => ["mostralo-play", "catalog", uid] as const };

/** Aceita link do YouTube (watch, youtu.be, shorts, embed) ou o id puro. */
export function parseYouTubeId(input: string | null | undefined): string | null {
  const v = String(input ?? "").trim();
  if (!v) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12) || null;
    const q = u.searchParams.get("v");
    if (q && /^[A-Za-z0-9_-]{11}$/.test(q)) return q;
    const m = u.pathname.match(/\/(embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

export function useMostraloPlayCatalog(userId?: string) {
  return useQuery({
    queryKey: PLAY_KEYS.catalog(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<PlayCatalog> => {
      const [cats, tuts, views] = await Promise.all([
        db.from("tutorial_categories").select("id, name, display_order, is_active").order("display_order"),
        db
          .from("tutorials")
          .select("id, category_id, title, description, youtube_url, thumbnail_url, duration_minutes, display_order, is_active")
          .eq("is_active", true)
          .order("display_order"),
        db
          .from("tutorial_views")
          .select("tutorial_id, watch_time_seconds, completed, updated_at, viewed_at")
          .eq("user_id", userId),
      ]);
      if (cats.error) throw cats.error;
      if (tuts.error) throw tuts.error;
      type Cat = { id: string; name: string; is_active: boolean | null };
      type Tut = {
        id: string;
        category_id: string | null;
        title: string;
        description: string | null;
        youtube_url: string;
        thumbnail_url: string | null;
        duration_minutes: number | null;
      };
      const tracks = ((cats.data ?? []) as Cat[])
        .filter((x) => x.is_active !== false)
        .map((x) => ({ id: x.id, title: x.name }));
      const all = (tuts.data ?? []) as Tut[];
      let n = 0;
      const episodes: PlayEpisode[] = [];
      for (const t of tracks)
        for (const x of all.filter((y) => y.category_id === t.id))
          episodes.push({
            id: x.id,
            track_id: t.id,
            number: ++n,
            title: x.title,
            description: x.description ?? "",
            duration_seconds: Math.max(0, (x.duration_minutes ?? 0) * 60),
            video_id: parseYouTubeId(x.youtube_url),
            thumbnail_url: x.thumbnail_url?.trim() ? x.thumbnail_url : null,
          });
      const progress: Record<string, PlayProgress> = {};
      for (const r of (views.data ?? []) as {
        tutorial_id: string;
        watch_time_seconds: number | null;
        completed: boolean | null;
        updated_at: string | null;
        viewed_at: string | null;
      }[])
        progress[r.tutorial_id] = {
          episode_id: r.tutorial_id,
          position_seconds: r.watch_time_seconds ?? 0,
          completed: !!r.completed,
          updated_at: r.updated_at ?? r.viewed_at ?? "",
        };
      return { tracks: tracks.filter((t) => episodes.some((e) => e.track_id === t.id)), episodes, progress };
    },
  });
}

/** Salva a posição do vídeo (a cada ~10 s e ao sair). "Assistido" nunca volta para falso. */
export function useSavePlayProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      userId: string;
      storeId: string | null;
      episodeId: string;
      position: number;
      duration: number;
      completed: boolean;
      wasCompleted: boolean;
    }) => {
      const { error } = await db.from("tutorial_views").upsert(
        {
          tutorial_id: p.episodeId,
          user_id: p.userId,
          store_id: p.storeId,
          watch_time_seconds: Math.max(0, Math.floor(p.position)),
          completed: p.completed || p.wasCompleted,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "tutorial_id,user_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, p) => {
      qc.setQueryData<PlayCatalog | undefined>(PLAY_KEYS.catalog(p.userId), (old) =>
        old
          ? {
              ...old,
              progress: {
                ...old.progress,
                [p.episodeId]: {
                  episode_id: p.episodeId,
                  position_seconds: Math.floor(p.position),
                  completed: p.completed || !!old.progress[p.episodeId]?.completed,
                  updated_at: new Date().toISOString(),
                },
              },
            }
          : old,
      );
      void qc.invalidateQueries({ queryKey: ["tutorial-views"] });
    },
  });
}

// ---------- utilidades ----------

/** Capa: a escolhida no cadastro do tutorial; senão a do YouTube em HD. */
export function episodeThumb(ep: PlayEpisode): string {
  if (ep.thumbnail_url) return ep.thumbnail_url;
  if (ep.video_id) return `https://i.ytimg.com/vi/${ep.video_id}/maxresdefault.jpg`;
  return "/mostralo-play/hero-1.jpg";
}

export const fmtClock = (s: number) =>
  s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "";
export const fmtMin = (s: number) => (s > 0 ? `${Math.max(1, Math.round(s / 60))} min` : "");

export function progressPct(ep: PlayEpisode, p?: PlayProgress): number {
  if (!p) return 0;
  if (p.completed) return 100;
  if (!ep.duration_seconds) return p.position_seconds > 5 ? 5 : 0;
  return Math.min(99, Math.round((p.position_seconds / ep.duration_seconds) * 100));
}

export function nextToWatch(cat: PlayCatalog): PlayEpisode | null {
  const eps = orderedEpisodes(cat);
  const started = Object.values(cat.progress)
    .filter((p) => !p.completed && p.position_seconds > 5)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const cur = started.map((p) => eps.find((e) => e.id === p.episode_id)).find(Boolean);
  if (cur) return cur;
  return eps.find((e) => !cat.progress[e.id]?.completed) ?? eps[0] ?? null;
}

export function orderedEpisodes(cat: PlayCatalog): PlayEpisode[] {
  return cat.episodes;
}
