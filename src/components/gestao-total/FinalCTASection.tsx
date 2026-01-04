import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket, FileSearch, Play, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Teste grátis por 7 dias",
  "Sem cartão de crédito",
  "Suporte em português",
  "Migração assistida",
];

export function FinalCTASection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
            AÇÃO
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Pronto Para{" "}
            <span className="text-primary">Centralizar Seu Negócio?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o melhor caminho para você começar
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Primary CTA */}
          <Card className="h-full border-2 border-primary bg-primary/5 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Começar Agora</h3>
              <p className="text-sm text-muted-foreground">
                Crie sua conta e tenha acesso imediato a todos os módulos
              </p>
              <Button asChild size="lg" className="w-full group">
                <Link to="/signup">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Diagnostic CTA */}
          <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                <FileSearch className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Diagnóstico Grátis</h3>
              <p className="text-sm text-muted-foreground">
                Descubra quanto seu negócio pode economizar com o Mostralo
              </p>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/diagnostico">
                  Fazer Diagnóstico
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Demo CTA */}
          <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Play className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Ver Demo ao Vivo</h3>
              <p className="text-sm text-muted-foreground">
                Acesse lojas de demonstração e veja o sistema funcionando
              </p>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/users-demo">
                  Acessar Demo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Segment Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Ideal para <span className="font-medium text-foreground">restaurantes, barbearias, farmácias, pet shops, supermercados</span> e mais de 50 segmentos.
          </p>
        </div>
      </div>
    </section>
  );
}
