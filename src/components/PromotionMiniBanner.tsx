import { Tag, ChevronRight } from 'lucide-react';

interface PromotionMiniBannerProps {
  promotionCount: number;
  onClick: () => void;
}

export function PromotionMiniBanner({ promotionCount, onClick }: PromotionMiniBannerProps) {
  if (promotionCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="w-full h-20 relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Background gradiente com shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-shimmer bg-[length:200%_100%]" />
      
      {/* Conteúdo */}
      <div className="relative h-full flex items-center justify-between px-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Tag className="h-6 w-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg">
              {promotionCount} {promotionCount === 1 ? 'Promoção Ativa' : 'Promoções Ativas'}! 🎉
            </div>
            <div className="text-sm text-white/90">
              Clique para ver todas as ofertas
            </div>
          </div>
        </div>
        <ChevronRight className="h-6 w-6" />
      </div>

      {/* Efeito de brilho */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </button>
  );
}
