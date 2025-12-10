import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

interface StoreData {
  name: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  city?: string;
  state?: string;
  primaryColor?: string;
  secondaryColor?: string;
  menuUrl: string;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  acceptsPix?: boolean;
  deliveryFee?: number;
  minOrderValue?: number;
}

interface StoreFlyerProps {
  storeData: StoreData;
}

export const StoreFlyer = forwardRef<HTMLDivElement, StoreFlyerProps>(
  ({ storeData }, ref) => {
    const qrDataUrl = useQRCode(storeData.menuUrl, 200);
    
    const primaryColor = storeData.primaryColor || '#f97316';

    const paymentMethods = [
      storeData.acceptsCash && 'Dinheiro',
      storeData.acceptsCard && 'Cartão',
      storeData.acceptsPix && 'PIX',
    ].filter(Boolean);

    return (
      <div 
        ref={ref}
        className="w-[148mm] min-h-[210mm] bg-white p-6 mx-auto shadow-lg print:shadow-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-4 pb-4 border-b-4" style={{ borderColor: primaryColor }}>
          {storeData.logoUrl && (
            <img 
              src={storeData.logoUrl} 
              alt={storeData.name}
              className="w-20 h-20 mx-auto mb-3 object-contain rounded-lg"
            />
          )}
          <h1 className="text-3xl font-bold mb-1" style={{ color: primaryColor }}>
            {storeData.name}
          </h1>
          {storeData.description && (
            <p className="text-base text-gray-600 italic">"{storeData.description}"</p>
          )}
        </div>

        {/* Main Content */}
        <div className="flex gap-4 mb-4">
          {/* Left Side - Info */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
              📍 Localização
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              {storeData.address}
              {storeData.city && ` - ${storeData.city}`}
              {storeData.state && `/${storeData.state}`}
            </p>

            <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
              📞 Contato
            </h2>
            <div className="space-y-1 text-sm text-gray-700">
              {storeData.phone && <p>📞 {storeData.phone}</p>}
              {storeData.whatsapp && <p>📱 {storeData.whatsapp}</p>}
              {storeData.instagram && <p>📸 @{storeData.instagram.replace('@', '')}</p>}
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="text-center">
            <div className="bg-gray-50 p-4 rounded-xl border-2" style={{ borderColor: primaryColor }}>
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />}
              <p className="text-base font-bold" style={{ color: primaryColor }}>
                📱 PEÇA ONLINE!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Escaneie o QR Code
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h2 className="text-lg font-bold mb-3 text-center" style={{ color: primaryColor }}>
            ✨ Por que escolher a gente?
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-lg">🚀</span>
              <span>Entrega Rápida</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">⭐</span>
              <span>Qualidade Premium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">💰</span>
              <span>Preços Justos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🎁</span>
              <span>Promoções Exclusivas</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 pt-3" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-center text-gray-700">
            <div className="text-sm">
              {paymentMethods.length > 0 && (
                <p>💳 <strong>{paymentMethods.join(' • ')}</strong></p>
              )}
              {storeData.deliveryFee !== undefined && (
                <p>🛵 Taxa: <strong>R$ {storeData.deliveryFee.toFixed(2)}</strong></p>
              )}
              {storeData.minOrderValue !== undefined && storeData.minOrderValue > 0 && (
                <p>📦 Mínimo: <strong>R$ {storeData.minOrderValue.toFixed(2)}</strong></p>
              )}
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Feito com ❤️ por <strong>Mostralo</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoreFlyer.displayName = 'StoreFlyer';
