import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublicTheme } from "@/lib/publicTheme";
import { ThemeToggle } from "./ThemeToggle";

/** WhatsApp do Mostralo nos botões do blog (mesmo número padrão de useMasterWhatsApp). */
export const SUPPORT_WA = "556194009368";
export const waLink = (text?: string) =>
  `https://wa.me/${SUPPORT_WA}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Chamada principal do blog: cadastro no Mostralo. */
export const SIGNUP_PATH = "/signup";

/**
 * Casca visual do blog e dos artigos (/conteudos, /guia/:slug, /autor/:slug).
 * Tema claro (tom papel) por padrão, com botão para o escuro; a escolha fica no navegador do visitante.
 */
export function PublicShell({ children, themeable = true }: { children: ReactNode; themeable?: boolean }) {
  const [theme, setTheme] = usePublicTheme();
  const { setTheme: setAppTheme } = useTheme();
  const light = !themeable || theme === "light";
  useEffect(() => { setAppTheme(light ? "light" : "dark"); }, [light, setAppTheme]);
  return (
    <div className={cn("min-h-screen bg-background text-foreground", light ? "paper [color-scheme:light]" : "[color-scheme:dark]")}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
            <img src="/favicon-mostralo.png" alt="" className="h-7 w-7 rounded-md" width={28} height={28} />
            Mostralo
          </Link>
          <div className="flex items-center gap-2">
            {themeable && <ThemeToggle theme={theme} onChange={setTheme} />}
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Início</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/conteudos">Blog</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={SIGNUP_PATH}>Começar agora</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="pt-16">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row md:px-6">
          <span className="font-display font-extrabold text-foreground">Mostralo</span>
          <nav className="flex flex-wrap justify-center gap-4" aria-label="Links do rodapé">
            <Link to="/conteudos" className="hover:text-foreground">Blog</Link>
            <Link to="/funcionalidades" className="hover:text-foreground">Funcionalidades</Link>
            <Link to="/nicho-barbearias" className="hover:text-foreground">Para barbearias</Link>
            <Link to="/gestao-360" className="hover:text-foreground">Gestão 360°</Link>
            <Link to="/sobre" className="hover:text-foreground">Sobre</Link>
            <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
          </nav>
          <p>© {new Date().getFullYear()} Mostralo</p>
        </div>
      </footer>
    </div>
  );
}
