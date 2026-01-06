import { 
  Phone, Mail, Globe, Instagram, Linkedin, Facebook, 
  ExternalLink, MessageCircle, Youtube, Calendar, Star
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CardFormData, CardTheme } from '@/types/digitalCard';
import { SaveContactButton } from './SaveContactButton';
import { ShareCardButton } from './ShareCardButton';

interface RatingStats {
  avg: number;
  count: number;
}

interface DigitalCardPreviewProps {
  data: Partial<CardFormData> & {
    booking_enabled?: boolean;
    booking_button_text?: string;
  };
  photoUrl?: string | null;
  qrCodeUrl?: string;
  isInteractive?: boolean;
  onClickAction?: (type: string, label?: string) => void;
  bookingUrl?: string;
  className?: string;
  ratings?: RatingStats | null;
}

const themeStyles: Record<CardTheme, { bg: string; text: string; accent: string; card: string }> = {
  dark: {
    bg: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
    text: 'text-white',
    accent: 'text-orange-500',
    card: 'bg-zinc-800/50 border-zinc-700',
  },
  light: {
    bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
    text: 'text-gray-900',
    accent: 'text-orange-600',
    card: 'bg-white/80 border-gray-200',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500',
    text: 'text-white',
    accent: 'text-white',
    card: 'bg-orange-700/30 border-orange-400/30',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900',
    text: 'text-white',
    accent: 'text-violet-300',
    card: 'bg-violet-800/30 border-violet-500/30',
  },
};

export function DigitalCardPreview({ 
  data, 
  photoUrl,
  qrCodeUrl,
  isInteractive = false,
  onClickAction,
  bookingUrl,
  className,
  ratings
}: DigitalCardPreviewProps) {
  const theme = data.theme || 'dark';
  const styles = themeStyles[theme];
  const accentColor = data.accent_color || '#f97316';

  const handleClick = (type: string, url?: string, label?: string) => {
    if (onClickAction) {
      onClickAction(type, label);
    }
    if (isInteractive && url) {
      window.open(url, '_blank');
    }
  };

  const getWhatsAppUrl = () => {
    if (!data.whatsapp) return '';
    const phone = data.whatsapp.replace(/\D/g, '');
    return `https://wa.me/55${phone}`;
  };

  const socialLinks = [
    { key: 'instagram', icon: Instagram, url: data.instagram ? `https://instagram.com/${data.instagram.replace('@', '')}` : null },
    { key: 'linkedin', icon: Linkedin, url: data.linkedin ? `https://linkedin.com/in/${data.linkedin}` : null },
    { key: 'facebook', icon: Facebook, url: data.facebook ? `https://facebook.com/${data.facebook}` : null },
    { key: 'youtube', icon: Youtube, url: data.youtube ? `https://youtube.com/@${data.youtube.replace('@', '')}` : null },
  ].filter(s => s.url);

  return (
    <div className={cn(
      'w-full mx-auto overflow-hidden shadow-2xl',
      'min-h-screen md:min-h-0 md:max-w-md md:rounded-2xl',
      styles.bg,
      className
    )}>
      <div className="p-6 pb-8 space-y-6 flex flex-col justify-center min-h-screen md:min-h-0">
        {/* Header com foto e informações */}
        <div className="text-center space-y-4">
          {/* Container do Avatar com botão de compartilhamento */}
          <div className="relative inline-flex items-center justify-center w-full">
            <Avatar className="w-28 h-28 border-4 shadow-xl" style={{ borderColor: accentColor }}>
              <AvatarImage src={photoUrl || ''} alt={data.name} />
              <AvatarFallback className="text-3xl bg-zinc-700 text-white">
                {data.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            {/* Botão de compartilhamento posicionado ao lado da foto */}
            {isInteractive && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 md:right-8">
                <ShareCardButton
                  cardUrl={typeof window !== 'undefined' ? window.location.href : ''}
                  cardName={data.name || 'Cartão Digital'}
                  theme={theme}
                  accentColor={accentColor}
                  onShare={(method) => onClickAction?.('share', method)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className={cn('text-2xl font-bold', styles.text)}>
              {data.name || 'Seu Nome'}
            </h1>
            {data.title && (
              <p className={cn('text-base', styles.accent)}>
                {data.title}
              </p>
            )}
            {data.company && (
              <p className={cn('text-sm opacity-70', styles.text)}>
                {data.company}
              </p>
            )}
          </div>

          {data.headline && (
            <p className={cn('text-sm opacity-80 max-w-xs mx-auto', styles.text)}>
              {data.headline}
            </p>
          )}

          {/* Avaliações */}
          {ratings && ratings.count > 0 && (
            <div className="flex items-center gap-2 justify-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-4 h-4',
                      star <= Math.round(ratings.avg)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400'
                    )}
                  />
                ))}
              </div>
              <span className={cn('text-sm opacity-70', styles.text)}>
                {ratings.avg.toFixed(1)} ({ratings.count} {ratings.count === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>
          )}

          {data.stats_text && (
            <div 
              className="inline-block px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {data.stats_text}
            </div>
          )}
        </div>

        {/* Bio */}
        {data.bio && (
          <p className={cn('text-sm text-center opacity-70', styles.text)}>
            {data.bio}
          </p>
        )}

        {/* CTA Principal */}
        {data.cta_text && (
          <Button
            className="w-full h-12 text-base font-semibold shadow-lg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: accentColor }}
            onClick={() => handleClick('cta', data.cta_url)}
          >
            {data.cta_text}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* Botão de Agendamento */}
        {data.booking_enabled && bookingUrl && (
          <Button
            className="w-full h-12 text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] bg-primary text-primary-foreground"
            onClick={() => handleClick('booking', bookingUrl, data.booking_button_text || 'Agendar Horário')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {data.booking_button_text || 'Agendar Horário'}
          </Button>
        )}

        {/* Botão Salvar Contato - apenas na página pública */}
        {isInteractive && (
          <SaveContactButton
            data={{
              name: data.name || '',
              title: data.title,
              company: data.company,
              whatsapp: data.whatsapp,
              phone: data.phone,
              email: data.email,
              website: data.website,
              instagram: data.instagram,
              linkedin: data.linkedin,
              facebook: data.facebook,
              youtube: data.youtube,
              tiktok: data.tiktok,
              bio: data.bio,
            }}
            photoUrl={photoUrl}
            theme={theme}
            accentColor={accentColor}
            onSave={() => onClickAction?.('save_contact')}
          />
        )}

        {/* Botões de Contato */}
        <div className="grid grid-cols-2 gap-3">
          {data.whatsapp && (
            <Button
              variant="outline"
              className={cn('h-11 gap-2', styles.card, styles.text)}
              onClick={() => handleClick('whatsapp', getWhatsAppUrl())}
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp
            </Button>
          )}
          {data.phone && (
            <Button
              variant="outline"
              className={cn('h-11 gap-2', styles.card, styles.text)}
              onClick={() => handleClick('phone', `tel:${data.phone}`)}
            >
              <Phone className="w-4 h-4" style={{ color: accentColor }} />
              Ligar
            </Button>
          )}
          {data.email && (
            <Button
              variant="outline"
              className={cn('h-11 gap-2', styles.card, styles.text)}
              onClick={() => handleClick('email', `mailto:${data.email}`)}
            >
              <Mail className="w-4 h-4" style={{ color: accentColor }} />
              Email
            </Button>
          )}
          {data.website && (
            <Button
              variant="outline"
              className={cn('h-11 gap-2', styles.card, styles.text)}
              onClick={() => handleClick('website', data.website)}
            >
              <Globe className="w-4 h-4" style={{ color: accentColor }} />
              Site
            </Button>
          )}
        </div>

        {/* Links Customizados */}
        {data.custom_links && data.custom_links.length > 0 && (
          <div className="space-y-2">
            {data.custom_links.map((link) => (
              <Button
                key={link.id}
                variant="outline"
                className={cn('w-full h-11 gap-2', styles.card, styles.text)}
                onClick={() => handleClick('custom_link', link.url, link.label)}
              >
                <ExternalLink className="w-4 h-4" style={{ color: accentColor }} />
                {link.label}
              </Button>
            ))}
          </div>
        )}

        {/* Redes Sociais */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 pt-2">
            {socialLinks.map(({ key, icon: Icon, url }) => (
              <button
                key={key}
                onClick={() => handleClick(key, url || undefined)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                  styles.card
                )}
              >
                <Icon className="w-5 h-5" style={{ color: accentColor }} />
              </button>
            ))}
          </div>
        )}

        {/* QR Code */}
        {qrCodeUrl && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-24 h-24 rounded-lg bg-white p-2"
            />
            <p className={cn('text-xs opacity-50', styles.text)}>
              Escaneie para salvar
            </p>
          </div>
        )}

        {/* Badge Mostralo */}
        {data.show_mostralo_badge !== false && (
          <div className={cn('text-center pt-4 text-xs opacity-50', styles.text)}>
            Powered by <span className="font-semibold" style={{ color: accentColor }}>MOSTRALO</span>
          </div>
        )}
      </div>
    </div>
  );
}
