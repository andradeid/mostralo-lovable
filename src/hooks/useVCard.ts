import { useCallback } from 'react';

interface VCardData {
  name: string;
  title?: string;
  company?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  bio?: string;
  photoUrl?: string;
}

const formatPhoneForVCard = (phone: string): string => {
  // Remove tudo exceto números
  const numbers = phone.replace(/\D/g, '');
  // Adiciona +55 se não tiver código do país
  if (numbers.length <= 11) {
    return `+55${numbers}`;
  }
  return `+${numbers}`;
};

const generateVCardContent = (data: VCardData, photoBase64?: string): string => {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    `N:${data.name};;;`,
  ];

  if (data.title) {
    lines.push(`TITLE:${data.title}`);
  }

  if (data.company) {
    lines.push(`ORG:${data.company}`);
  }

  if (data.whatsapp) {
    lines.push(`TEL;TYPE=CELL:${formatPhoneForVCard(data.whatsapp)}`);
  }

  if (data.phone) {
    lines.push(`TEL;TYPE=WORK:${formatPhoneForVCard(data.phone)}`);
  }

  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  }

  if (data.website) {
    const url = data.website.startsWith('http') ? data.website : `https://${data.website}`;
    lines.push(`URL:${url}`);
  }

  // Redes sociais
  if (data.instagram) {
    const handle = data.instagram.replace('@', '');
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${handle}`);
  }

  if (data.linkedin) {
    const url = data.linkedin.startsWith('http') 
      ? data.linkedin 
      : `https://linkedin.com/in/${data.linkedin}`;
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${url}`);
  }

  if (data.facebook) {
    const url = data.facebook.startsWith('http') 
      ? data.facebook 
      : `https://facebook.com/${data.facebook}`;
    lines.push(`X-SOCIALPROFILE;TYPE=facebook:${url}`);
  }

  if (data.youtube) {
    const url = data.youtube.startsWith('http') 
      ? data.youtube 
      : `https://youtube.com/${data.youtube}`;
    lines.push(`X-SOCIALPROFILE;TYPE=youtube:${url}`);
  }

  if (data.tiktok) {
    const handle = data.tiktok.replace('@', '');
    lines.push(`X-SOCIALPROFILE;TYPE=tiktok:https://tiktok.com/@${handle}`);
  }

  if (data.bio) {
    // Escapar caracteres especiais no NOTE
    const escapedBio = data.bio.replace(/\n/g, '\\n').replace(/,/g, '\\,');
    lines.push(`NOTE:${escapedBio}`);
  }

  if (photoBase64) {
    lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
};

export const useVCard = () => {
  const convertImageToBase64 = useCallback(async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove o prefixo "data:image/...;base64,"
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      console.warn('Não foi possível converter a imagem para base64');
      return null;
    }
  }, []);

  const downloadVCard = useCallback(async (data: VCardData, includePhoto = true): Promise<void> => {
    let photoBase64: string | null = null;

    if (includePhoto && data.photoUrl) {
      photoBase64 = await convertImageToBase64(data.photoUrl);
    }

    const vCardContent = generateVCardContent(data, photoBase64 || undefined);
    
    // Criar blob e disparar download
    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [convertImageToBase64]);

  return { downloadVCard };
};
