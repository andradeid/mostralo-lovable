import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVCard } from '@/hooks/useVCard';
import { CardTheme } from '@/types/digitalCard';

interface SaveContactButtonProps {
  data: {
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
  };
  photoUrl?: string | null;
  theme?: CardTheme;
  accentColor?: string;
  onSave?: () => void;
  className?: string;
}

const themeButtonStyles: Record<CardTheme, string> = {
  dark: 'bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600',
  light: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300',
  orange: 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-300',
  gradient: 'bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm',
};

export function SaveContactButton({
  data,
  photoUrl,
  theme = 'dark',
  accentColor,
  onSave,
  className = '',
}: SaveContactButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { downloadVCard } = useVCard();

  const handleSaveContact = async () => {
    setIsLoading(true);
    
    try {
      await downloadVCard({
        ...data,
        photoUrl: photoUrl || undefined,
      });
      
      onSave?.();
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSaveContact}
      disabled={isLoading}
      className={`w-full gap-2 border ${themeButtonStyles[theme]} ${className}`}
      style={accentColor ? { borderColor: accentColor } : undefined}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isLoading ? 'Salvando...' : 'Salvar Contato'}
    </Button>
  );
}
