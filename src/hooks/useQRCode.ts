import { useState, useEffect } from 'react';

export function useQRCode(data: string, size: number = 200): string {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!data) {
      setQrDataUrl('');
      return;
    }
    
    // Gera URL do QR Code usando API externa
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png`;
    
    // Converte a imagem para base64 para evitar problemas de CORS no canvas
    const convertToBase64 = async () => {
      try {
        const response = await fetch(qrApiUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setQrDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        // Fallback: usar URL direta se fetch falhar
        console.warn('QR Code fetch failed, using direct URL');
        setQrDataUrl(qrApiUrl);
      }
    };
    
    convertToBase64();
  }, [data, size]);

  return qrDataUrl;
}
