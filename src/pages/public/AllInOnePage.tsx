import { usePageSEO } from '@/hooks/useSEO';
import { AllInOneHero } from '@/components/all-in-one/AllInOneHero';
import { ScienceOfAgility } from '@/components/all-in-one/ScienceOfAgility';
import { EcosystemPillars } from '@/components/all-in-one/EcosystemPillars';
import { ROINumbers } from '@/components/all-in-one/ROINumbers';
import { CostComparisonTable } from '@/components/all-in-one/CostComparisonTable';
import { EliteInvitation } from '@/components/all-in-one/EliteInvitation';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';

const AllInOnePage = () => {
  usePageSEO({
    title: 'Mostralo All-in-One | Sistema Completo para Operações de Alto Fluxo',
    description: 'Totem + KDS + Comanda + Delivery em um único ecossistema. Reduza filas, aumente ticket médio em 25% e elimine erros. Por Marcos Andrade.',
    keywords: 'sistema all in one restaurante, totem autoatendimento, kds cozinha, comanda digital, software fast food, sistema franquia, mostralo'
  });

  return (
    <div className="min-h-screen bg-background dark">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <Store className="w-6 h-6" />
            <span className="font-display font-bold">Mostralo</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs font-medium">
              ALL-IN-ONE
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* ATENÇÃO - Hero Section */}
        <AllInOneHero />
        
        {/* INTERESSE - Ciência da Agilidade */}
        <ScienceOfAgility />
        
        {/* DESEJO - Ecossistema All-in-One (4 Pilares) */}
        <EcosystemPillars />
        
        {/* Comparativo de Custos */}
        <CostComparisonTable />
        
        {/* DESEJO - ROI Numbers */}
        <ROINumbers />
        
        {/* AÇÃO - Elite Invitation */}
        <EliteInvitation />
      </main>

      {/* Footer */}
      <footer className="py-12 bg-secondary/30 border-t border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              <div>
                <p className="font-display font-bold text-foreground">Mostralo.com.br</p>
                <p className="text-muted-foreground text-sm">
                  Tecnologia iFood, Uber e Instagram aplicada ao seu negócio
                </p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-sm">
                Desenvolvido por <span className="text-primary font-semibold">Marcos Andrade</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                30 anos de experiência internacional
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AllInOnePage;
