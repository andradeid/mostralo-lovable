import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Store } from "lucide-react";
import {
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  Clock,
  Star,
  Gift,
  AlertTriangle,
  X
} from "lucide-react";
import { usePageSEO } from "@/hooks/useSEO";
import { CountdownTimer } from "@/components/promo/CountdownTimer";
import { LeadChatForm } from "@/components/leads/LeadChatForm";
import { DiagnosticPopup } from "@/components/landing/DiagnosticPopup";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesGridSection } from "@/components/landing/FeaturesGridSection";
import { MainFooter } from "@/components/MainFooter";
import { FAQSection } from "@/components/promo/FAQSection";

const OfertaEspecialPage = () => {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  usePageSEO({
    title: "Oferta Especial - 3 Meses com até 50% OFF | Mostralo",
    description: "Oferta por tempo limitado! Assine o Mostralo com desconto especial nos primeiros 3 meses. Taxa zero, automação total e recuperação de clientes.",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleOpenWhatsApp = (whatsappNumber: string, message: string) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const promoPlans = [
    {
      name: "Básico",
      originalPrice: "397,90",
      promoPrice: "197",
      description: "O início da sua independência",
      features: [
        "Cardápio Digital",
        "Gestão de Pedidos",
        "Delivery",
        "Suporte 7 dias"
      ],
      popular: false,
      badge: null,
      savings: "200,90"
    },
    {
      name: "Profissional",
      originalPrice: "597,90",
      promoPrice: "297",
      description: "Sistema completo de crescimento",
      features: [
        "Tudo do Básico",
        "WhatsApp Marketing",
        "Relatórios Avançados",
        "Promoções",
        "KDS (Cozinha)"
      ],
      popular: true,
      badge: "⭐ Mais Popular",
      savings: "300,90"
    },
    {
      name: "Premium",
      originalPrice: "997,90",
      promoPrice: "497",
      description: "Para quem quer escala",
      features: [
        "Tudo do Profissional",
        "Totem Autoatendimento",
        "SENTINELA",
        "Integrações",
        "Multi-lojas"
      ],
      popular: false,
      badge: "👑 Premium",
      savings: "500,90"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white hidden sm:block">Mostralo</span>
            </Link>

            {/* Countdown Timer */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/80 border border-orange-500/30 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                <Clock className="w-4 h-4 text-orange-400 hidden sm:block" />
                <span className="text-xs sm:text-sm text-orange-400 font-medium hidden sm:block">Oferta expira em:</span>
                <CountdownTimer 
                  hours={24} 
                  storageKey="oferta-especial-24h"
                  onExpire={() => setIsExpired(true)}
                  compact
                />
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              asChild
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold flex-shrink-0"
            >
              <Link to="/signup">
                <span className="hidden sm:inline">Contrate Agora</span>
                <span className="sm:hidden">Contratar</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Componente Reutilizado */}
      <HeroSection 
        secondaryButtonText="CONTRATE JÁ!" 
        secondaryButtonLink="/signup"
        hidePrimaryButton={true}
      />

      {/* Features Grid Section */}
      <FeaturesGridSection />

      {/* Plans Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/50" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              PREÇOS PROMOCIONAIS
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Escolha seu plano com{" "}
              <span className="text-orange-500">desconto especial</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Valores válidos para os <span className="text-orange-400 font-semibold">3 primeiros meses</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {promoPlans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative p-6 bg-zinc-900/80 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular ? 'border-orange-500 scale-[1.02] shadow-2xl shadow-orange-500/20' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white'
                  }`}>
                    {plan.badge}
                  </Badge>
                )}

                {/* Plan Name */}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-400">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg text-zinc-500 line-through">
                      R$ {plan.originalPrice}
                    </span>
                    <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
                      -{Math.round((parseFloat(plan.savings.replace(',', '.')) / parseFloat(plan.originalPrice.replace(',', '.'))) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-zinc-400">R$</span>
                    <span className="text-4xl font-bold text-orange-400">{plan.promoPrice}</span>
                    <span className="text-sm text-zinc-400">/mês</span>
                  </div>
                  <p className="text-xs text-green-400 mt-2">
                    Economize R$ {plan.savings} por mês
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' 
                      : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                  onClick={() => setShowLeadForm(true)}
                  disabled={isExpired}
                >
                  {isExpired ? 'Oferta Expirada' : 'Quero Este Plano'}
                </Button>
              </Card>
            ))}
          </div>

          {/* Fine print */}
          <p className="text-center text-xs text-zinc-500 mt-8">
            * Valores promocionais válidos para os primeiros 3 meses. 
            Após o período promocional, o valor volta ao normal.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Por que escolher o{" "}
              <span className="text-orange-500">Mostralo</span>?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "0% de Taxa", desc: "Diferente do iFood, não cobramos comissão" },
              { icon: Zap, title: "Setup Rápido", desc: "Seu sistema pronto em até 48 horas" },
              { icon: Star, title: "+500 Clientes", desc: "Lojas ativas usando nossa plataforma" },
              { icon: Clock, title: "Suporte 7 dias", desc: "Atendimento humanizado sempre" }
            ].map((item, index) => (
              <Card 
                key={index}
                className="p-6 bg-zinc-900/50 border-zinc-800 text-center hover:border-orange-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Lead Form Modal */}
      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none">
          <button 
            onClick={() => setShowLeadForm(false)}
            className="absolute right-2 top-2 z-50 p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <LeadChatForm 
            onComplete={handleOpenWhatsApp}
            onClose={() => setShowLeadForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diagnostic Popup */}
      <DiagnosticPopup />

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default OfertaEspecialPage;
