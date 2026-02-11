import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, CreditCard, MessageCircle, ArrowRight } from "lucide-react";
import { trackClick } from "@/utils/trackClick";

export const AboutCTA = () => {
  const whatsappNumber = "5511999999999"; // Substituir pelo número real
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de saber mais sobre o Mostralo.");

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            Pronto para Transformar seu Negócio?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Comece hoje mesmo e veja a diferença que o Mostralo pode fazer no seu estabelecimento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/diagnostico">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Stethoscope className="w-5 h-5" />
                Diagnóstico Gratuito
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/#plans">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <CreditCard className="w-5 h-5" />
                Ver Planos
              </Button>
            </Link>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="ghost" className="gap-2 w-full sm:w-auto">
                <MessageCircle className="w-5 h-5" />
                Falar com Consultor
              </Button>
            </a>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão de crédito • Suporte em português • Resultados em 24h
          </p>
        </div>
      </div>
    </section>
  );
};
