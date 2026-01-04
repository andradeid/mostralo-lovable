import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function GestaoHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      
      <div className="container relative z-10 px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div>
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5">
              <Layers className="w-4 h-4 mr-2 text-primary" />
              28+ MÓDULOS EM 1 PLATAFORMA
            </Badge>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Você Gerencia Seu Negócio com{" "}
              <span className="text-primary">5 Sistemas Diferentes?</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Um para vendas, outro para delivery, outro para marketing, outro para financeiro... 
              E nenhum conversa com o outro.
            </p>
          </div>

          {/* Shocking Stat */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-destructive/10 border border-destructive/20">
            <Zap className="w-5 h-5 text-destructive" />
            <span className="text-sm md:text-base font-medium text-destructive">
              87% dos negócios perdem 12h/semana com sistemas fragmentados
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg px-8 group">
              <Link to="/signup">
                Quero Centralizar Tudo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/diagnostico">
                Fazer Diagnóstico Grátis
              </Link>
            </Button>
          </div>

          {/* Visual Animation - 5 icons merging into 1 */}
          <div className="pt-12 md:pt-16">
            <div className="relative max-w-lg mx-auto">
              {/* Fragmented icons */}
              <div className="flex justify-center gap-2 md:gap-4 mb-4">
                {['📊', '📦', '💬', '💳', '📈'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-2xl md:text-3xl opacity-60 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>

              {/* Arrow down */}
              <div className="flex justify-center py-4">
                <div className="text-muted-foreground animate-bounce">↓</div>
              </div>

              {/* Unified Mostralo */}
              <div className="mx-auto w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex items-center justify-center animate-pulse">
                <span className="text-3xl md:text-4xl font-bold text-primary-foreground">M</span>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Tudo integrado. Tudo conectado. <span className="text-primary font-semibold">Tudo Mostralo.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
