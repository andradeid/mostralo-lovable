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

interface StoreInstagramPostProps {
  storeData: StoreData;
}

export const StoreInstagramPost = forwardRef<HTMLDivElement, StoreInstagramPostProps>(
  ({ storeData }, ref) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(storeData.menuUrl)}`;
    const primaryColor = storeData.primaryColor || '#f97316';

    return (
      <div
        ref={ref}
        className="mx-auto bg-white shadow-lg print:shadow-none"
        style={{ 
          width: '1080px', 
          height: '1080px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div 
          className="w-full h-full flex flex-col items-center justify-between py-12 px-10 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, white 0%, ${primaryColor}15 50%, ${primaryColor}25 100%)` }}
        >
          {/* Decorative corner */}
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{ 
              background: `linear-gradient(225deg, ${primaryColor} 0%, transparent 70%)`,
              opacity: 0.3
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-48 h-48"
            style={{ 
              background: `linear-gradient(45deg, ${primaryColor} 0%, transparent 70%)`,
              opacity: 0.2
            }}
          />

          {/* Top Section - Logo & Name */}
          <div className="text-center z-10">
            <div className="flex items-center justify-center gap-6 mb-4">
              {storeData.logoUrl && (
                <img 
                  src={storeData.logoUrl} 
                  alt={storeData.name}
                  className="w-24 h-24 object-contain rounded-2xl shadow-lg"
                />
              )}
              <h1 className="text-5xl font-bold" style={{ color: primaryColor }}>
                {storeData.name}
              </h1>
            </div>
            {storeData.description && (
              <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
                {storeData.description}
              </p>
            )}
          </div>

          {/* Center - QR Code */}
          <div className="text-center z-10">
            <div 
              className="bg-white p-8 rounded-[32px] shadow-2xl border-4"
              style={{ borderColor: primaryColor }}
            >
              <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56 mx-auto mb-6" />
              <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                📱 PEÇA AGORA!
              </p>
              <p className="text-xl text-gray-500 mt-3">
                Escaneie e faça seu pedido
              </p>
            </div>
          </div>

          {/* Bottom Section - Benefits & Contact */}
          <div className="text-center z-10 w-full">
            {/* Benefits Row */}
            <div className="flex justify-center gap-6 mb-8">
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <span className="text-2xl">🚀</span>
                <span className="font-semibold text-gray-700">Entrega Rápida</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-gray-700">Qualidade</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <span className="text-2xl">💰</span>
                <span className="font-semibold text-gray-700">Preço Justo</span>
              </div>
            </div>

            {/* Contact */}
            <div className="flex justify-center gap-8 text-xl text-gray-600">
              {storeData.whatsapp && (
                <span className="flex items-center gap-2">
                  <span className="text-2xl">📱</span> {storeData.whatsapp}
                </span>
              )}
              {storeData.instagram && (
                <span className="flex items-center gap-2">
                  <span className="text-2xl">📸</span> @{storeData.instagram.replace('@', '')}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-gray-400 text-sm">
              Feito com ❤️ por Mostralo
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoreInstagramPost.displayName = 'StoreInstagramPost';
