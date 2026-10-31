import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicTheme } from "@/lib/publicTheme";

/** Botão claro/escuro do blog e dos artigos. */
export function ThemeToggle({ theme, onChange }: { theme: PublicTheme; onChange: (t: PublicTheme) => void }) {
  const light = theme === "light";
  return (
    <Button variant="ghost" size="icon" onClick={() => onChange(light ? "dark" : "light")}
      aria-label={light ? "Mudar para o modo escuro" : "Mudar para o modo claro"} title={light ? "Modo escuro" : "Modo claro"}>
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
