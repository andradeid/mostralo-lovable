import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

interface Promotion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  endDate?: string;
}

interface StoreData {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  menuUrl: string;
}

interface StoreCouponProps {
  storeData: StoreData;
  promotion: Promotion;
}

export const StoreCoupon = forwardRef<HTMLDivElement, StoreCouponProps>(
  ({ storeData, promotion }, ref) => {
    const qrDataUrl = useQRCode(storeData.menuUrl, 150);
    const primaryColor = storeData.primaryColor || '#f97316';

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };

    const getDiscountText = () => {
      if (promotion.discountPercentage) {
        return `${promotion.discountPercentage}% OFF`;
      }
      if (promotion.discountAmount) {
        return `R$ ${promotion.discountAmount.toFixed(2)} OFF`;
      }
      return 'DESCONTO';
    };

    const renderCoupon = (index: number) => (
      <div 
        key={index}
        className="w-[100mm] h-[60mm] border-2 border-dashed rounded-xl bg-white overflow-hidden flex"
        style={{ borderColor: primaryColor, pageBreakInside: 'avoid' }}
      >
        {/* Left - Discount */}
        <div 
          className="w-1/3 flex flex-col items-center justify-center text-white p-2"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-3xl font-black">
            {getDiscountText()}
          </span>
          <span className="text-xs mt-1 opacity-90">CUPOM</span>
        </div>

        {/* Right - Details */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {storeData.logoUrl && (
                <img src={storeData.logoUrl} alt="" className="w-6 h-6 object-contain" />
              )}
              <span className="font-bold text-sm" style={{ color: primaryColor }}>
                {storeData.name}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {promotion.description || promotion.name}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {promotion.code && (
                <div className="bg-gray-100 px-2 py-1 rounded text-center">
                  <p className="text-[9px] text-gray-500">USE O CÓDIGO</p>
                  <p className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                    {promotion.code}
                  </p>
                </div>
              )}
              {formatDate(promotion.endDate) && (
                <p className="text-[9px] text-gray-400 mt-1">
                  Válido até: {formatDate(promotion.endDate)}
                </p>
              )}
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-12 h-12" />}
          </div>
        </div>
      </div>
    );

    return (
      <div 
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white p-4 mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <p className="text-center text-sm text-gray-500 mb-4">
          ✂️ Recorte os cupons para distribuir aos clientes
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          {[...Array(8)].map((_, i) => renderCoupon(i))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Feito com ❤️ por Mostralo
        </p>
      </div>
    );
  }
);

StoreCoupon.displayName = 'StoreCoupon';
