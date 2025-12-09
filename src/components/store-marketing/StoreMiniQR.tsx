import { forwardRef } from 'react';

interface StoreData {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  menuUrl: string;
}

interface StoreMiniQRProps {
  storeData: StoreData;
}

export const StoreMiniQR = forwardRef<HTMLDivElement, StoreMiniQRProps>(
  ({ storeData }, ref) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeData.menuUrl)}`;
    const primaryColor = storeData.primaryColor || '#f97316';

    const renderMiniQR = (index: number) => (
      <div 
        key={index}
        className="w-[50mm] h-[60mm] border border-dashed border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center p-3"
        style={{ pageBreakInside: 'avoid' }}
      >
        {storeData.logoUrl && (
          <img 
            src={storeData.logoUrl} 
            alt={storeData.name}
            className="w-10 h-10 object-contain mb-2"
          />
        )}
        
        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mb-2" />
        
        <p className="text-xs font-bold text-center" style={{ color: primaryColor }}>
          {storeData.name}
        </p>
        <p className="text-[9px] text-gray-500 text-center mt-1">
          📱 Escaneie para<br/>ver o cardápio
        </p>
      </div>
    );

    return (
      <div 
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white p-4 mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <p className="text-center text-sm text-gray-500 mb-4">
          ✂️ Recorte para usar em mesas, balcões ou sacolas
        </p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          {[...Array(12)].map((_, i) => renderMiniQR(i))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Feito com ❤️ por Mostralo
        </p>
      </div>
    );
  }
);

StoreMiniQR.displayName = 'StoreMiniQR';