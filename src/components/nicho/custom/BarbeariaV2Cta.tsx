import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// CTA da página Barbearias V2 (botão + selos de garantia).

export const BarbeariaV2Cta = ({ text = "Comece Agora", className = "" }: { text?: string; className?: string }) => (
  <div className={cn("flex flex-col items-center gap-3", className)}>
    <Link to="/signup" className="w-full sm:w-auto">
      <Button 
        size="lg" 
        className="w-full sm:w-auto bg-[#FF5C00] hover:bg-[#E65200] text-white px-10 py-7 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
      >
        {text}
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </Link>
    <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mt-2">
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">7 dias para testar e garantia de 30 dias</span><span className="sm:hidden">Grátis</span></span>
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">Sem cartão</span><span className="sm:hidden">Seguro</span></span>
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">Suporte humanizado</span><span className="sm:hidden">Suporte</span></span>
    </div>
  </div>
);
