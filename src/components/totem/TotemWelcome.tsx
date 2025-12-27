import { StoreInfo } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Store, Hand } from 'lucide-react';

interface TotemWelcomeProps {
  store: StoreInfo;
  config: TotemConfig;
  onStart: () => void;
}

export function TotemWelcome({ store, config, onStart }: TotemWelcomeProps) {
  const logoSizeMap = {
    small: 'h-20 w-20',
    medium: 'h-32 w-32',
    large: 'h-44 w-44',
  };

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={onStart}
      style={{
        backgroundImage: config.show_welcome_image && config.welcome_image_url
          ? `url(${config.welcome_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay se tiver imagem de fundo */}
      {config.show_welcome_image && config.welcome_image_url && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Logo */}
        {config.show_logo && (
          <div className={`${logoSizeMap[config.logo_size || 'medium']} rounded-full overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8 shadow-xl`}>
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store
                className="h-1/2 w-1/2"
                style={{ color: config.theme_color }}
              />
            )}
          </div>
        )}

        {/* Título */}
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            color: config.show_welcome_image && config.welcome_image_url
              ? '#ffffff'
              : 'var(--totem-text)',
          }}
        >
          {config.welcome_title || 'Bem-vindo!'}
        </h1>

        {/* Subtítulo */}
        <p
          className="text-xl md:text-2xl mb-12 opacity-80"
          style={{
            color: config.show_welcome_image && config.welcome_image_url
              ? '#ffffff'
              : 'var(--totem-muted)',
          }}
        >
          {config.welcome_subtitle || 'Toque para começar seu pedido'}
        </p>

        {/* Animação de toque */}
        <div
          className="animate-bounce"
          style={{ color: config.theme_color }}
        >
          <Hand className="h-16 w-16" />
        </div>
      </div>
    </div>
  );
}
