import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

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

interface StoreInstagramStoryProps {
  storeData: StoreData;
}

export const StoreInstagramStory = forwardRef<HTMLDivElement, StoreInstagramStoryProps>(
  ({ storeData }, ref) => {
    const qrDataUrl = useQRCode(storeData.menuUrl, 300);
    const primaryColor = storeData.primaryColor || '#f97316';

    return (
      <div
        ref={ref}
        className="mx-auto bg-white shadow-lg print:shadow-none"
        style={{ 
          width: '1080px', 
          height: '1920px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div 
          className="w-full h-full flex flex-col items-center justify-between py-16 px-12 relative overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}bb 100%)` }}
        >
          {/* Decorative circles */}
          <div className="absolute top-32 left-8 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute top-64 right-4 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-48 left-16 w-24 h-24 rounded-full bg-white/10" />

          {/* Top Section - Logo & Name */}
          <div className="text-center z-10">
            {storeData.logoUrl && (
              <div className="bg-white p-6 rounded-full shadow-2xl mb-8 inline-block">
                <img 
                  src={storeData.logoUrl} 
                  alt={storeData.name}
                  className="w-40 h-40 object-contain"
                />
              </div>
            )}
            <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-lg">
              {storeData.name}
            </h1>
            {storeData.description && (
              <p className="text-2xl text-white/90 max-w-lg mx-auto">
                {storeData.description}
              </p>
            )}
          </div>

          {/* Middle Section - QR Code */}
          <div className="text-center z-10">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-72 h-72 mx-auto mb-6" />}
              <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                📱 PEÇA ONLINE!
              </p>
              <p className="text-xl text-gray-500 mt-3">
                Escaneie o QR Code e<br/>acesse nosso cardápio
              </p>
            </div>
          </div>

          {/* Bottom Section - Benefits & Contact */}
          <div className="text-center z-10 w-full">
            {/* Benefits */}
            <div className="flex flex-col gap-4 mb-12">
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full mx-auto">
                <span className="text-3xl text-white font-semibold">🚀 Entrega Rápida</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full mx-auto">
                <span className="text-3xl text-white font-semibold">⭐ Qualidade Premium</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full mx-auto">
                <span className="text-3xl text-white font-semibold">💰 Preços Justos</span>
              </div>
            </div>

            {/* Contact */}
            <div className="text-white/90 text-2xl space-y-3">
              {storeData.whatsapp && (
                <p>📱 WhatsApp: {storeData.whatsapp}</p>
              )}
              {storeData.instagram && (
                <p>📸 @{storeData.instagram.replace('@', '')}</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-white/50 text-lg">
              Feito com ❤️ por Mostralo
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoreInstagramStory.displayName = 'StoreInstagramStory';
