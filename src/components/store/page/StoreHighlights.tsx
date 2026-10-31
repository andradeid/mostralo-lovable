// Faixas abaixo das categorias: mini banner de promoções, atalho para a agenda e carrossel de banners.
import { lazy, Suspense } from 'react';
import { Calendar } from 'lucide-react';
import type { StorePageBanner } from '@/hooks/store/storePageTypes';

const BannerCarousel = lazy(() => import('@/components/BannerCarousel').then(m => ({ default: m.BannerCarousel })));
const PromotionMiniBanner = lazy(() => import('@/components/PromotionMiniBanner').then(m => ({ default: m.PromotionMiniBanner })));

interface Props {
  storeId: string;
  searchTerm: string;
  promotionCount: number;
  hasBooking: boolean;
  banners: StorePageBanner[];
  onOpenPromotions: () => void;
  onOpenBooking: () => void;
}

export function StoreHighlights({ storeId, searchTerm, promotionCount, hasBooking, banners, onOpenPromotions, onOpenBooking }: Props) {
  return (
    <>
      {/* Mini Banner de Promoções */}
      {!searchTerm && storeId && promotionCount > 0 && (
        <div className="px-4 py-3 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded" />}>
              <PromotionMiniBanner
                promotionCount={promotionCount}
                onClick={() => onOpenPromotions()}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Atalho para a agenda (loja com serviços agendáveis) */}
      {!searchTerm && hasBooking && (
        <div className="px-4 pt-4 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-left hover:bg-primary/15 transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Calendar className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">Agendar horário</span>
                  <span className="block text-xs text-muted-foreground">Escolha o serviço, o profissional e o horário</span>
                </span>
              </span>
              <span className="text-sm font-semibold text-primary">Agendar →</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Carousel */}
      {!searchTerm && banners.length > 0 && (
        <div className="px-4 py-4 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded" />}>
              <BannerCarousel banners={banners} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
