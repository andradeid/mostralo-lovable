import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePageSEO } from "@/hooks/useSEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { DashboardFooter } from "@/components/admin/DashboardFooter";
import { GestaoHero } from "@/components/gestao-total/GestaoHero";
import { PilaresSection } from "@/components/gestao-total/PilaresSection";
import { SubscriptionClubSection } from "@/components/landing/SubscriptionClubSection";
import { NichesSection } from "@/components/gestao-total/NichesSection";
import { ProofSection } from "@/components/gestao-total/ProofSection";
import { ComparisonSection } from "@/components/gestao-total/ComparisonSection";
import { FinalCTASection } from "@/components/gestao-total/FinalCTASection";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

export default function GestaoTotalPage() {
  const { setTheme } = useTheme();

  // Forçar tema dark ao abrir a página
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  usePageSEO({
    title: 'Gestão Total | Mostralo - Sistema Completo para Negócios Locais',
    description: 'Vendas, Operações, Marketing e Financeiro em uma só plataforma. 28+ módulos integrados para restaurantes, salões, farmácias, pet shops e mais.',
    keywords: 'sistema gestão completo, plataforma negócios locais, erp restaurante, software salão beleza, sistema farmácia, gestão pet shop, cardápio digital, delivery próprio'
  });

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">
      <LandingHeader />
      
      <main>
        {/* ATENÇÃO - Hero */}
        <GestaoHero />
        
        {/* INTERESSE - 4 Pilares */}
        <PilaresSection />
        
        {/* NOVO! Clube de Assinaturas */}
        <SubscriptionClubSection />
        
        {/* DESEJO - Nichos */}
        <NichesSection />
        
        {/* DESEJO - Prova Social */}
        <ProofSection />
        
        {/* DESEJO - Comparativo */}
        <ComparisonSection />
        
        {/* AÇÃO - CTAs Finais */}
        <FinalCTASection />
      </main>

      <DashboardFooter />
      
      {/* Utilities */}
      <CookieBanner />
      <WhatsAppLeadButton />
    </div>
  );
}
