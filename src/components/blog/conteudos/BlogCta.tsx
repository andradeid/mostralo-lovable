import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SIGNUP_PATH } from "@/components/blog/PublicShell";

/** Faixa de chamada no meio da lista do blog. */
export function BlogCta() {
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-amber-400/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div>
        <p className="text-xl font-black text-foreground md:text-2xl">Loja virtual, agenda e pedidos no mesmo sistema, sem comissão por venda</p>
        <p className="mt-1 text-sm text-muted-foreground">A gente deixa tudo pronto para você. Garantia de 7 dias.</p>
      </div>
      <Button asChild size="lg"><Link to={SIGNUP_PATH}>Começar no Mostralo</Link></Button>
    </aside>
  );
}
