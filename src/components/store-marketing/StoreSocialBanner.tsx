import { forwardRef } from 'react';

interface StoreData {
  name: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  primaryColor?: string;
  menuUrl: string;
}

interface StoreSocialBannerProps {
  storeData: StoreData;
}

export const StoreSocialBanner = forwardRef<HTMLDivElement, StoreSocialBannerProps>(
  ({ storeData }, ref) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(storeData.menuUrl)}`;
    const primaryColor = storeData.primaryColor || '#f97316';

    return (
      <div
        ref={ref}
        className="mx-auto bg-white shadow-lg print:shadow-none"
        style={{ 
          width: '1200px', 
          height: '630px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div 
          className="w-full h-full flex items-center justify-between p-12 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%)` }}
        >
          {/* Decorative elements */}
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div 
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
            style={{ backgroundColor: primaryColor }}
          />

          {/* Left Content */}
          <div className="flex-1 z-10 pr-8">
            <div className="flex items-center gap-6 mb-6">
              {storeData.logoUrl && (
                <img 
                  src={storeData.logoUrl} 
                  alt={storeData.name}
                  className="w-28 h-28 object-contain rounded-2xl shadow-md"
                />
              )}
              <div>
                <h1 className="text-5xl font-bold mb-2" style={{ color: primaryColor }}>
                  {storeData.name}
                </h1>
                {storeData.description && (
                  <p className="text-xl text-gray-600 max-w-md">
                    {storeData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">🚀</span>
                <span className="font-semibold text-gray-700">Entrega Rápida</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-gray-700">Qualidade Premium</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                <span className="text-2xl">💰</span>
                <span className="font-semibold text-gray-700">Preços Justos</span>
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-6 text-lg text-gray-600">
              {storeData.whatsapp && (
                <span className="flex items-center gap-2">
                  <span className="text-xl">📱</span> {storeData.whatsapp}
                </span>
              )}
              {storeData.instagram && (
                <span className="flex items-center gap-2">
                  <span className="text-xl">📸</span> @{storeData.instagram.replace('@', '')}
                </span>
              )}
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="text-center z-10">
            <div 
              className="bg-white p-6 rounded-3xl shadow-xl border-4"
              style={{ borderColor: primaryColor }}
            >
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 mx-auto mb-4" />
              <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                PEÇA AGORA!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Escaneie e acesse<br/>nosso cardápio
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-4 right-6 text-xs text-gray-400">
            Feito com ❤️ por Mostralo
          </div>
        </div>
      </div>
    );
  }
);

StoreSocialBanner.displayName = 'StoreSocialBanner';
