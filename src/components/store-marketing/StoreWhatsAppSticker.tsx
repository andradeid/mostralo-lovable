import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

interface StoreData {
  name: string;
  whatsapp?: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface StoreWhatsAppStickerProps {
  storeData: StoreData;
}

export const StoreWhatsAppSticker = forwardRef<HTMLDivElement, StoreWhatsAppStickerProps>(
  ({ storeData }, ref) => {
    const whatsappNumber = storeData.whatsapp?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${whatsappNumber}`;
    const qrDataUrl = useQRCode(whatsappUrl, 200);
    const primaryColor = storeData.primaryColor || '#25D366'; // Verde WhatsApp

    const renderSticker = (index: number) => (
      <div 
        key={index}
        className="w-[70mm] h-[90mm] border-2 border-dashed border-gray-300 rounded-2xl bg-white flex flex-col items-center justify-center p-4"
        style={{ pageBreakInside: 'avoid' }}
      >
        {storeData.logoUrl && (
          <img 
            src={storeData.logoUrl} 
            alt={storeData.name}
            className="w-14 h-14 object-contain mb-2"
          />
        )}
        
        <h3 className="font-bold text-base text-center mb-1" style={{ color: primaryColor }}>
          {storeData.name}
        </h3>

        <div 
          className="rounded-xl p-3 mb-3"
          style={{ backgroundColor: '#25D366' }}
        >
          {qrDataUrl && <img src={qrDataUrl} alt="WhatsApp QR" className="w-28 h-28 bg-white rounded-lg p-1" />}
        </div>

        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: '#25D366' }}>
            📱 PEÇA PELO
          </p>
          <p className="text-2xl font-black" style={{ color: '#25D366' }}>
            WhatsApp
          </p>
        </div>

        {storeData.whatsapp && (
          <p className="text-sm text-gray-600 mt-2">
            {storeData.whatsapp}
          </p>
        )}
      </div>
    );

    return (
      <div 
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white p-4 mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <p className="text-center text-sm text-gray-500 mb-4">
          ✂️ Recorte para colar em vitrines, portas ou balcões
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          {[...Array(6)].map((_, i) => renderSticker(i))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Feito com ❤️ por Mostralo
        </p>
      </div>
    );
  }
);

StoreWhatsAppSticker.displayName = 'StoreWhatsAppSticker';
