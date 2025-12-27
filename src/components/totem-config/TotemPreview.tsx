import { TotemConfig } from '@/hooks/useTotemConfig';
import { Store, ShoppingCart, CreditCard } from 'lucide-react';

interface TotemPreviewProps {
  config: Partial<TotemConfig>;
  storeLogo?: string;
  storeName?: string;
}

export function TotemPreview({ config, storeLogo, storeName }: TotemPreviewProps) {
  const isVertical = config.orientation !== 'horizontal';
  const themeColor = config.theme_color || '#f97316';
  const bgColor = config.dark_mode ? '#1a1a1a' : (config.background_color || '#ffffff');
  const textColor = config.dark_mode ? '#ffffff' : '#1a1a1a';
  const mutedColor = config.dark_mode ? '#a1a1a1' : '#6b7280';

  const logoSizeMap = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  const cardSizeMap = {
    small: 'h-12',
    medium: 'h-16',
    large: 'h-20',
  };

  return (
    <div className="sticky top-4">
      <h3 className="font-medium mb-3">Preview</h3>
      <div
        className={`rounded-xl border-4 border-muted overflow-hidden shadow-lg ${
          isVertical ? 'w-48 aspect-[9/16]' : 'w-72 aspect-video'
        }`}
        style={{ backgroundColor: bgColor }}
      >
        {/* Header */}
        <div
          className="p-2 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${config.dark_mode ? '#333' : '#e5e7eb'}` }}
        >
          {config.show_logo && (
            <div className={`${logoSizeMap[config.logo_size || 'medium']} rounded-full overflow-hidden bg-muted flex items-center justify-center`}>
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="h-4 w-4" style={{ color: mutedColor }} />
              )}
            </div>
          )}
          <div className="flex-1 px-2">
            <div
              className="text-xs font-medium truncate"
              style={{ color: textColor }}
            >
              {storeName || 'Sua Loja'}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`p-2 flex-1 ${isVertical ? 'space-y-2' : 'flex gap-2'}`}>
          {/* Categories */}
          {config.categories_position !== 'hidden' && (
            <div
              className={`flex gap-1 ${
                config.categories_position === 'left' && !isVertical
                  ? 'flex-col w-16'
                  : 'flex-row overflow-x-auto'
              }`}
            >
              {['Cat 1', 'Cat 2', 'Cat 3'].map((cat, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded text-xs whitespace-nowrap"
                  style={{
                    backgroundColor: i === 0 ? themeColor : (config.dark_mode ? '#333' : '#f3f4f6'),
                    color: i === 0 ? '#fff' : textColor,
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          <div className={`flex-1 grid gap-1 ${isVertical ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`rounded border p-1 ${cardSizeMap[config.product_card_size || 'medium']}`}
                style={{
                  borderColor: config.dark_mode ? '#333' : '#e5e7eb',
                  backgroundColor: config.dark_mode ? '#262626' : '#fff',
                }}
              >
                {config.show_product_images && (
                  <div className="h-1/2 rounded bg-muted mb-1" />
                )}
                <div
                  className="text-[6px] truncate"
                  style={{ color: textColor }}
                >
                  Produto {i}
                </div>
                {config.show_product_description && (
                  <div
                    className="text-[5px] truncate"
                    style={{ color: mutedColor }}
                  >
                    Descrição
                  </div>
                )}
                <div
                  className="text-[6px] font-bold"
                  style={{ color: themeColor }}
                >
                  R$ 9,90
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        {config.cart_position === 'bottom' && (
          <div
            className="p-2 flex items-center justify-between"
            style={{
              backgroundColor: themeColor,
              color: '#fff',
            }}
          >
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              <span className="text-[8px]">3 itens</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold">R$ 29,70</span>
              <CreditCard className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        {isVertical ? 'Modo Vertical (9:16)' : 'Modo Horizontal (16:9)'}
      </p>
    </div>
  );
}
