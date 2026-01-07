import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePageSEO } from "@/hooks/useSEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { DashboardFooter } from "@/components/admin/DashboardFooter";
import { Hero360 } from "@/components/gestao-360/Hero360";
import { PilaresValor } from "@/components/gestao-360/PilaresValor";
import { SubscriptionClubSection } from "@/components/landing/SubscriptionClubSection";
import { OrigemSection } from "@/components/gestao-360/OrigemSection";
import { TestimonialsNichos } from "@/components/gestao-360/TestimonialsNichos";
import { TecnologiaSection } from "@/components/gestao-360/TecnologiaSection";
import { FAQ360 } from "@/components/gestao-360/FAQ360";
import { CTA360Section } from "@/components/gestao-360/CTA360Section";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { DiagnosticPopup } from "@/components/landing/DiagnosticPopup";

export default function Gestao360Page() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  usePageSEO({
    title: 'Inteligência Operacional 360° | Mostralo - Gerir Lucro, Não Apenas Vendas',
    description: 'Sistema de Inteligência Operacional All-in-One. Atração Preditiva, Conversão Autônoma, Eficiência Operacional e Gestão de Talentos em um único ecossistema.',
    keywords: 'inteligência operacional, gestão de lucro, sistema all-in-one, automação de vendas, gestão de equipe, PDV inteligente, IA para negócios',
  });

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">
      <LandingHeader />
      
      <main>
        {/* HERO - O Pitch de Elevador */}
        <Hero360 />

        {/* OS 4 PILARES DE VALOR */}
        <PilaresValor />

        {/* NOVO! Clube de Assinaturas */}
        <SubscriptionClubSection />

        {/* ORIGEM - Nascida no Varejo */}
        <OrigemSection />

        {/* DEPOIMENTOS POR NICHOS */}
        <TestimonialsNichos />

        {/* DIFERENCIAL TÉCNICO - Tecnologia Marcos Andrade */}
        <TecnologiaSection />

        {/* FAQ - Implementação, Custos e Suporte */}
        <FAQ360 />

        {/* CTA FINAL */}
        <CTA360Section />
      </main>

      <DashboardFooter />
      
      <CookieBanner />
      <WhatsAppLeadButton />
      <DiagnosticPopup />
    </div>
  );
}
