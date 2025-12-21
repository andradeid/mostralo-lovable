import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Monitor } from 'lucide-react';
import { usePublicSignage } from '@/hooks/usePublicSignage';

export default function SignageDisplayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { store, items, config, loading, error } = usePublicSignage(slug);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = items[currentIndex];

  // Atualizar relógio
  useEffect(() => {
    if (!config?.show_clock) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.show_clock]);

  // Controlar transições
  useEffect(() => {
    if (items.length === 0 || !currentItem) return;

    const duration = currentItem.duration_seconds * 1000;

    // Para vídeos, aguardar o vídeo terminar (ou usar a duração definida se for maior)
    if (currentItem.file_type === 'video' && videoRef.current) {
      const handleVideoEnd = () => {
        goToNext();
      };

      videoRef.current.addEventListener('ended', handleVideoEnd);
      
      // Timeout de segurança caso o vídeo não termine
      const timeout = setTimeout(goToNext, duration);

      return () => {
        videoRef.current?.removeEventListener('ended', handleVideoEnd);
        clearTimeout(timeout);
      };
    }

    // Para imagens, usar a duração definida
    const timer = setTimeout(goToNext, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, items, currentItem]);

  const goToNext = () => {
    if (config?.transition_type !== 'none') {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
        setIsTransitioning(false);
      }, config?.transition_duration_ms || 500);
    } else {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black"
        style={{ backgroundColor: config?.background_color || '#000000' }}
      >
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black"
      >
        <div className="text-center text-white max-w-md px-8">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Painel Indisponível</h1>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!config?.is_enabled) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Painel Desativado</h1>
          <p className="text-white/70">Este painel não está ativo no momento</p>
        </div>
      </div>
    );
  }

  // Estilos de transição
  const getTransitionStyle = () => {
    const duration = config?.transition_duration_ms || 500;
    
    switch (config?.transition_type) {
      case 'fade':
        return {
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${duration}ms ease-in-out`
        };
      case 'slide':
        return {
          transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
          transition: `transform ${duration}ms ease-in-out`
        };
      default:
        return {};
    }
  };

  // Formatar hora
  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: config?.background_color || '#000000' }}
    >
      {/* Conteúdo principal */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={getTransitionStyle()}
      >
        {currentItem && (
          currentItem.file_type === 'video' ? (
            <video
              ref={videoRef}
              key={currentItem.id}
              src={currentItem.file_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              key={currentItem.id}
              src={currentItem.file_url}
              alt={currentItem.title}
              className="w-full h-full object-contain"
            />
          )
        )}
      </div>

      {/* Relógio */}
      {config?.show_clock && (
        <div className="absolute top-6 right-6 text-right text-white drop-shadow-lg">
          <div className="text-5xl font-bold tracking-wider">
            {formatTime()}
          </div>
          <div className="text-lg capitalize text-white/80 mt-1">
            {formatDate()}
          </div>
        </div>
      )}

      {/* Indicador de slides */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Logo da loja (opcional) */}
      {store && (
        <div className="absolute bottom-6 left-6 text-white/60 text-sm">
          {store.name}
        </div>
      )}
    </div>
  );
}
