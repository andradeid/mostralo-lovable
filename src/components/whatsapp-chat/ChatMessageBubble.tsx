import { cn } from '@/lib/utils';
import { Bot, Download, FileText, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing';
  const time = format(new Date(message.timestamp), 'HH:mm');
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.5, 5)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.5, 0.5)), []);
  const handleReset = useCallback(() => { setZoom(1); setPosition({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z + (e.deltaY > 0 ? -0.2 : 0.2), 0.5), 5));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoom, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const openLightbox = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setLightboxOpen(true);
  }, []);


  const renderMedia = () => {
    const { message_type, media_url, media_filename, media_mimetype } = message;

    if (!media_url && message_type === 'text') return null;

    switch (message_type) {
      case 'image':
        if (!media_url || imageError) {
          return (
            <div className="bg-muted/30 rounded p-3 mb-1 text-xs text-muted-foreground flex items-center gap-2">
              📷 Imagem não disponível
            </div>
          );
        }
        return (
          <>
            <img
              src={media_url}
              alt="Imagem"
              className="rounded max-w-full max-h-[300px] object-contain mb-1 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/95 border-none flex items-center justify-center">
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-3 right-3 z-50 text-white/70 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={media_url}
                  alt="Imagem ampliada"
                  className="max-w-full max-h-[85vh] object-contain rounded"
                />
              </DialogContent>
            </Dialog>
          </>
        );

      case 'video':
        if (!media_url) {
          return (
            <div className="bg-muted/30 rounded p-3 mb-1 text-xs text-muted-foreground flex items-center gap-2">
              🎥 Vídeo não disponível
            </div>
          );
        }
        return (
          <video
            src={media_url}
            controls
            className="rounded max-w-full max-h-[300px] mb-1"
            preload="metadata"
          />
        );

      case 'audio':
        if (!media_url) {
          return (
            <div className="flex items-center gap-2 mb-1 py-1">
              <span className="text-xs">🎵 Mensagem de áudio</span>
            </div>
          );
        }
        return (
          <audio
            src={media_url}
            controls
            className="max-w-full mb-1"
            style={{ height: '36px', minWidth: '200px' }}
          />
        );

      case 'document':
        return (
          <a
            href={media_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded p-2 mb-1 transition-colors",
              isOutgoing ? "bg-white/10 hover:bg-white/20" : "bg-muted/50 hover:bg-muted"
            )}
          >
            <FileText className="w-8 h-8 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {media_filename || 'Documento'}
              </p>
              <p className="text-[10px] opacity-70">
                {media_mimetype || 'Arquivo'}
              </p>
            </div>
            {media_url && <Download className="w-4 h-4 flex-shrink-0 opacity-70" />}
          </a>
        );

      case 'sticker':
        if (!media_url) {
          return <span className="text-2xl mb-1 block">🏷️</span>;
        }
        return (
          <img
            src={media_url}
            alt="Sticker"
            className="max-w-[150px] max-h-[150px] mb-1"
            onError={() => setImageError(true)}
          />
        );

      case 'location':
        return null; // Content already has location text

      default:
        if (media_url) {
          return (
            <a
              href={media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline mb-1 block"
            >
              📎 Abrir anexo
            </a>
          );
        }
        return null;
    }
  };

  return (
    <div className={cn('flex mb-1', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 text-sm relative',
          isOutgoing
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border rounded-bl-sm'
        )}
      >
        {/* Indicador de bot */}
        {message.is_from_bot && isOutgoing && (
          <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
            <Bot className="w-3 h-3" /> Bot
          </div>
        )}

        {/* Mídia */}
        {renderMedia()}

        {/* Conteúdo de texto */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Hora */}
        <span
          className={cn(
            'text-[10px] float-right mt-1 ml-2',
            isOutgoing ? 'opacity-70' : 'text-muted-foreground'
          )}
        >
          {time}
        </span>
      </div>
    </div>
  );
}