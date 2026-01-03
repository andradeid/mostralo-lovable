import { usePageSEO } from "@/hooks/useSEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { DashboardFooter } from "@/components/admin/DashboardFooter";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutMission } from "@/components/about/AboutMission";
import { AboutModules } from "@/components/about/AboutModules";
import { AboutNiches } from "@/components/about/AboutNiches";
import { AboutComparison } from "@/components/about/AboutComparison";
import { AboutCTA } from "@/components/about/AboutCTA";

const AboutPage = () => {
  usePageSEO({
    title: "Sobre o Mostralo - Plataforma Completa para Negócios Locais",
    description: "Conheça a evolução do Mostralo: de cardápio digital a plataforma all-in-one com 28+ módulos para delivery, PDV, marketing e gestão. Atendemos 16+ nichos de negócios.",
    keywords: "sobre mostralo, plataforma negócios locais, sistema delivery, pdv restaurante, gestão comercial, automação whatsapp"
  });

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <AboutHero />
        <AboutMission />
        <AboutModules />
        <AboutNiches />
        <AboutComparison />
        <AboutCTA />
      </main>
      <DashboardFooter />
    </div>
  );
};

export default AboutPage;
