import { forwardRef } from 'react';
import { useQRCode } from '@/hooks/useQRCode';

interface StoreData {
  name: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  logoUrl?: string;
  primaryColor?: string;
  menuUrl: string;
}

interface StoreBusinessCardProps {
  storeData: StoreData;
}

export const StoreBusinessCard = forwardRef<HTMLDivElement, StoreBusinessCardProps>(
  ({ storeData }, ref) => {
    const qrDataUrl = useQRCode(storeData.menuUrl, 150);
    const primaryColor = storeData.primaryColor || '#f97316';

    const renderCard = (index: number) => (
      <div 
        key={index}
        className="w-[85mm] h-[55mm] border border-dashed border-gray-300 rounded-lg overflow-hidden bg-white flex"
        style={{ pageBreakInside: 'avoid' }}
      >
        {/* Left Side */}
        <div 
          className="w-1/3 flex flex-col items-center justify-center p-3"
          style={{ backgroundColor: primaryColor }}
        >
          {storeData.logoUrl ? (
            <img 
              src={storeData.logoUrl} 
              alt={storeData.name}
              className="w-16 h-16 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                {storeData.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: primaryColor }}>
              {storeData.name}
            </h3>
            <div className="text-xs text-gray-600 space-y-0.5">
              {storeData.phone && <p>📞 {storeData.phone}</p>}
              {storeData.whatsapp && <p>📱 {storeData.whatsapp}</p>}
              {storeData.instagram && <p>📸 @{storeData.instagram.replace('@', '')}</p>}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="text-[10px] text-gray-500">
              <p>Escaneie para</p>
              <p className="font-semibold" style={{ color: primaryColor }}>ver o cardápio!</p>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-12 h-12" />}
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
          ✂️ Recorte na linha pontilhada para separar os cartões
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => renderCard(i))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Feito com ❤️ por Mostralo
        </p>
      </div>
    );
  }
);

StoreBusinessCard.displayName = 'StoreBusinessCard';
