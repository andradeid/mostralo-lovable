import { usePageSEO } from "@/hooks/useSEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { GestaoHero } from "@/components/gestao-total/GestaoHero";
import { PilaresSection } from "@/components/gestao-total/PilaresSection";
import { NichesSection } from "@/components/gestao-total/NichesSection";
import { ProofSection } from "@/components/gestao-total/ProofSection";
import { ComparisonSection } from "@/components/gestao-total/ComparisonSection";
import { FinalCTASection } from "@/components/gestao-total/FinalCTASection";
import { CookieBanner } from "@/components/CookieBanner";

export default function GestaoTotalPage() {
  usePageSEO({
    title: 'Gestão Total | Mostralo - Sistema Completo para Negócios Locais',
    description: 'Vendas, Operações, Marketing e Financeiro em uma só plataforma. 28+ módulos integrados para restaurantes, salões, farmácias, pet shops e mais.',
    keywords: 'sistema gestão completo, plataforma negócios locais, erp restaurante, software salão beleza, sistema farmácia, gestão pet shop, cardápio digital, delivery próprio'
  });

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main>
        {/* ATENÇÃO - Hero */}
        <GestaoHero />
        
        {/* INTERESSE - 4 Pilares */}
        <PilaresSection />
        
        {/* DESEJO - Nichos */}
        <NichesSection />
        
        {/* DESEJO - Prova Social */}
        <ProofSection />
        
        {/* DESEJO - Comparativo */}
        <ComparisonSection />
        
        {/* AÇÃO - CTAs Finais */}
        <FinalCTASection />
      </main>
      
      {/* Utilities */}
      <CookieBanner />
    </div>
  );
}
