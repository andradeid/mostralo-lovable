import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Monitor, Maximize, ImageOff, Info, Store } from 'lucide-react';
import { usePublicSignage } from '@/hooks/usePublicSignage';
import { Button } from '@/components/ui/button';

export default function SignageDisplayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { store, items, config, loading, error } = usePublicSignage(slug);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenButton, setShowFullscreenButton] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];
  const isVertical = config?.orientation === 'vertical';

  // Fullscreen handler
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenButton(false);
      }
    } catch (err) {
      console.log('Fullscreen não suportado:', err);
    }
  }, []);

  // Monitorar estado do fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowFullscreenButton(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide fullscreen button após alguns segundos
  useEffect(() => {
    if (!isFullscreen && showFullscreenButton) {
      const timer = setTimeout(() => {
        setShowFullscreenButton(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, showFullscreenButton]);

  // Mostrar botão ao mover o mouse
  const handleMouseMove = useCallback(() => {
    if (!isFullscreen) {
      setShowFullscreenButton(true);
    }
  }, [isFullscreen]);

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

  if (error || !store) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white max-w-md px-8">
          <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Loja Não Encontrada</h1>
          <p className="text-white/70">
            O painel "{slug}" não existe ou foi removido
          </p>
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

  // Tela quando não há mídias cadastradas
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-white max-w-lg px-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-white/60" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            Nenhum conteúdo configurado
          </h1>
          
          <p className="text-white/70 mb-8">
            Este painel ainda não possui mídias para exibição
          </p>
          
          <div className="bg-white/10 rounded-xl p-6 text-left">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-400" />
              Como configurar:
            </h2>
            <ol className="space-y-3 text-white/80 text-sm">
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Acesse o painel administrativo da sua loja</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Vá em <strong>Marketing → Painel Digital</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Adicione imagens ou vídeos promocionais</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-8 text-white/40 text-sm">
            {store.name}
          </div>
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

  // Estilos baseados na orientação
  const containerStyle = {
    backgroundColor: config?.background_color || '#000000',
    aspectRatio: isVertical ? '9/16' : '16/9',
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden flex items-center justify-center bg-black"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* Container com aspect ratio correto */}
      <div 
        className="relative w-full h-full max-w-full max-h-full"
        style={containerStyle}
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
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                key={currentItem.id}
                src={currentItem.file_url}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
            )
          )}
        </div>

        {/* Relógio - posição ajustada para orientação */}
        {config?.show_clock && (
          <div className={`absolute drop-shadow-lg text-white ${
            isVertical 
              ? 'top-8 left-1/2 -translate-x-1/2 text-center' 
              : 'top-6 right-6 text-right'
          }`}>
            <div className={`font-bold tracking-wider ${isVertical ? 'text-6xl' : 'text-5xl'}`}>
              {formatTime()}
            </div>
            <div className={`capitalize text-white/80 mt-1 ${isVertical ? 'text-xl' : 'text-lg'}`}>
              {formatDate()}
            </div>
          </div>
        )}

        {/* Indicador de slides */}
        <div className={`absolute flex gap-2 ${
          isVertical 
            ? 'bottom-12 left-1/2 -translate-x-1/2' 
            : 'bottom-6 left-1/2 -translate-x-1/2'
        }`}>
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
          <div className={`absolute text-white/60 text-sm ${
            isVertical ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-6 left-6'
          }`}>
            {store.name}
          </div>
        )}
      </div>

      {/* Botão de Fullscreen */}
      {showFullscreenButton && !isFullscreen && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <Button 
            onClick={enterFullscreen}
            size="lg"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30"
          >
            <Maximize className="h-5 w-5 mr-2" />
            Tela Cheia
          </Button>
        </div>
      )}
    </div>
  );
}
