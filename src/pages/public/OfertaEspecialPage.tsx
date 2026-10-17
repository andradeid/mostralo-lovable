import { MostraloPlansSection } from '@/components/pricing/MostraloPlansSection';
import { PRICING_ASSURANCE } from '@/lib/mostraloPricing';
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
    title: "Planos Mostralo | Agenda, Essencial, Completo e Sob medida",
    description: "Sem comissão por pedido. Implantação grátis, 7 dias para testar e garantia de 30 dias.",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleOpenWhatsApp = (whatsappNumber: string, message: string) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  

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
            <p className="text-sm text-muted-foreground">{PRICING_ASSURANCE}</p>

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
      <MostraloPlansSection priority="Essencial" />

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
