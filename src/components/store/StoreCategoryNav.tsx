import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface StoreCategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  hasFeaturedProducts: boolean;
  primaryColor: string;
  onCategorySelect: (categoryId: string | null) => void;
  showStickyHeader: boolean;
}

export function StoreCategoryNav({
  categories,
  selectedCategory,
  hasFeaturedProducts,
  primaryColor,
  onCategorySelect,
  showStickyHeader,
}: StoreCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Checa se há conteúdo para scrollar nas laterais
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, categories.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const activeStyle = { backgroundColor: primaryColor, color: 'white' };
  const inactiveStyle = { borderColor: primaryColor, color: primaryColor };

  return (
    <div className={`sticky bg-white border-b z-40 shadow-sm transition-all duration-200 ${showStickyHeader ? 'top-[48px]' : 'top-0'}`}>
      <div className="relative max-w-[1080px] mx-auto">
        {/* Seta esquerda - desktop */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-center w-8 bg-gradient-to-r from-white via-white/90 to-transparent"
            aria-label="Categorias anteriores"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: primaryColor }} />
          </button>
        )}

        {/* Container scrollável */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 pb-2"
        >
          {/* Destaques */}
          {hasFeaturedProducts && (
            <Button
              variant={selectedCategory === 'featured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategorySelect('featured')}
              className="whitespace-nowrap"
              style={selectedCategory === 'featured' ? activeStyle : inactiveStyle}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Destaques
            </Button>
          )}

          {/* Todas */}
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategorySelect(null)}
            className="whitespace-nowrap"
            style={selectedCategory === null ? activeStyle : inactiveStyle}
          >
            Todas
          </Button>

          {/* Categorias */}
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategorySelect(category.id)}
              className="whitespace-nowrap"
              style={selectedCategory === category.id ? activeStyle : inactiveStyle}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Seta direita - desktop */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center w-8 bg-gradient-to-l from-white via-white/90 to-transparent"
            aria-label="Mais categorias"
          >
            <ChevronRight className="w-5 h-5" style={{ color: primaryColor }} />
          </button>
        )}
      </div>
    </div>
  );
}
