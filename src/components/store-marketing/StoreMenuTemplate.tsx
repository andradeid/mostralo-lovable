import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  isOnOffer?: boolean;
  offerPrice?: number;
  imageUrl?: string;
  hasAddons?: boolean;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface StoreData {
  name: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  primaryColor?: string;
  menuUrl: string;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  acceptsPix?: boolean;
}

interface StoreMenuTemplateProps {
  storeData: StoreData;
  categories: Category[];
}

export const StoreMenuTemplate = forwardRef<HTMLDivElement, StoreMenuTemplateProps>(
  ({ storeData, categories }, ref) => {
    const qrDataUrl = useQRCode(storeData.menuUrl, 150);
    const primaryColor = storeData.primaryColor || '#f97316';

    const formatPrice = (price: number) => {
      return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const paymentMethods = [
      storeData.acceptsCash && 'Dinheiro',
      storeData.acceptsCard && 'Cartão',
      storeData.acceptsPix && 'PIX',
    ].filter(Boolean);

    return (
      <div 
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white p-6 mx-auto shadow-lg print:shadow-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-4 pb-4 border-b-4" style={{ borderColor: primaryColor }}>
          <div className="flex items-center justify-center gap-4 mb-2">
            {storeData.logoUrl && (
              <img 
                src={storeData.logoUrl} 
                alt={storeData.name}
                className="w-16 h-16 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
                {storeData.name}
              </h1>
              {storeData.description && (
                <p className="text-sm text-gray-600 italic">"{storeData.description}"</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-6 text-sm text-gray-600 mt-2">
            {storeData.address && (
              <span>📍 {storeData.address}{storeData.city && ` - ${storeData.city}`}</span>
            )}
            {storeData.phone && <span>📞 {storeData.phone}</span>}
            {storeData.whatsapp && <span>📱 {storeData.whatsapp}</span>}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 
                className="text-xl font-bold mb-2 pb-1 border-b-2"
                style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
              >
                {category.name}
              </h2>
              
              <div className="space-y-2">
                {category.products.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-start gap-2">
                    {/* Foto do Produto */}
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: `${primaryColor}40` }}
                      >
                        🍽️
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{product.name}</span>
                        {product.isOnOffer && (
                          <span 
                            className="text-[10px] px-1 py-0.5 rounded text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            PROMO
                          </span>
                        )}
                        {product.hasAddons && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-gray-200 text-gray-600">
                            ⚙️ Personalizável
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-[10px] text-gray-500 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right whitespace-nowrap flex-shrink-0">
                      {product.isOnOffer && product.offerPrice ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="font-bold text-sm" style={{ color: primaryColor }}>
                            {formatPrice(product.offerPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-gray-900">{formatPrice(product.price)}</span>
                      )}
                    </div>
                  </div>
                ))}
                {category.products.length > 10 && (
                  <p className="text-xs text-gray-400 italic">
                    ... e mais {category.products.length - 10} itens. Veja todos no cardápio digital!
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2" style={{ borderColor: `${primaryColor}40` }}>
          <div className="flex items-center justify-between">
            <div>
              {paymentMethods.length > 0 && (
                <p className="text-sm text-gray-600">
                  💳 <strong>{paymentMethods.join(' • ')}</strong>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Preços sujeitos a alteração. Consulte o cardápio digital.
              </p>
            </div>
            
            <div className="text-center">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 mx-auto" />}
              <p className="text-xs font-medium mt-1" style={{ color: primaryColor }}>
                📱 Cardápio Digital
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-4">
          Feito com ❤️ por Mostralo
        </p>
      </div>
    );
  }
);

StoreMenuTemplate.displayName = 'StoreMenuTemplate';
