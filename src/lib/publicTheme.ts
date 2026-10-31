import { useEffect, useState } from "react";

/** Tema das páginas de conteúdo (blog e artigos): claro por padrão (melhor para ler), escuro se o visitante escolher. Fica no navegador dele. */
export type PublicTheme = "dark" | "light";
const KEY = "mostralo-blog-theme";
const EVT = "mostralo-blog-theme";

export function readPublicTheme(): PublicTheme {
  try { return localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

export function usePublicTheme(): [PublicTheme, (t: PublicTheme) => void] {
  const [theme, setTheme] = useState<PublicTheme>(readPublicTheme);
  useEffect(() => {
    const sync = () => setTheme(readPublicTheme());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const set = (t: PublicTheme) => {
    try { localStorage.setItem(KEY, t); } catch { /* navegador sem armazenamento: vale só nesta visita */ }
    setTheme(t);
    window.dispatchEvent(new Event(EVT));
  };
  return [theme, set];
}
