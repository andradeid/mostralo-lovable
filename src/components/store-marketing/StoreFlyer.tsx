import { forwardRef } from 'react';

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
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeData.menuUrl)}`;
    
    const primaryColor = storeData.primaryColor || '#f97316';

    const paymentMethods = [
      storeData.acceptsCash && 'Dinheiro',
      storeData.acceptsCard && 'Cartão',
      storeData.acceptsPix && 'PIX',
    ].filter(Boolean);

    return (
      <div 
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white p-8 mx-auto shadow-lg print:shadow-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b-4" style={{ borderColor: primaryColor }}>
          {storeData.logoUrl && (
            <img 
              src={storeData.logoUrl} 
              alt={storeData.name}
              className="w-24 h-24 mx-auto mb-4 object-contain rounded-lg"
            />
          )}
          <h1 className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>
            {storeData.name}
          </h1>
          {storeData.description && (
            <p className="text-lg text-gray-600 italic">"{storeData.description}"</p>
          )}
        </div>

        {/* Main Content */}
        <div className="flex gap-8 mb-8">
          {/* Left Side - Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
              📍 Localização
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {storeData.address}
              {storeData.city && ` - ${storeData.city}`}
              {storeData.state && `/${storeData.state}`}
            </p>

            <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
              📞 Contato
            </h2>
            <div className="space-y-2 text-lg text-gray-700">
              {storeData.phone && <p>📞 Telefone: {storeData.phone}</p>}
              {storeData.whatsapp && <p>📱 WhatsApp: {storeData.whatsapp}</p>}
              {storeData.instagram && <p>📸 Instagram: @{storeData.instagram.replace('@', '')}</p>}
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="text-center">
            <div className="bg-gray-50 p-6 rounded-2xl border-4" style={{ borderColor: primaryColor }}>
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-4" />
              <p className="text-xl font-bold" style={{ color: primaryColor }}>
                📱 PEÇA ONLINE!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Escaneie o QR Code<br />e acesse nosso cardápio digital
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: primaryColor }}>
            ✨ Por que escolher a gente?
          </h2>
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span>Entrega Rápida</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span>Qualidade Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span>Preços Justos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <span>Promoções Exclusivas</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-4 pt-6" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-center text-gray-700">
            <div>
              {paymentMethods.length > 0 && (
                <p className="text-lg">
                  💳 Aceitamos: <strong>{paymentMethods.join(' • ')}</strong>
                </p>
              )}
              {storeData.deliveryFee !== undefined && (
                <p className="text-lg">
                  🛵 Taxa de Entrega: <strong>R$ {storeData.deliveryFee.toFixed(2)}</strong>
                </p>
              )}
              {storeData.minOrderValue !== undefined && storeData.minOrderValue > 0 && (
                <p className="text-lg">
                  📦 Pedido Mínimo: <strong>R$ {storeData.minOrderValue.toFixed(2)}</strong>
                </p>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Feito com ❤️ por</p>
              <p className="font-bold">Mostralo</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoreFlyer.displayName = 'StoreFlyer';