import { cn } from '@/lib/utils';
import { Bot, Download, FileText, X, ZoomIn, ZoomOut, RotateCcw, Reply, SmilePlus, MapPin, Copy, Check, CheckCheck, Clock, AlertCircle, Smartphone, Monitor, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Componente de status da mensagem
function MessageStatusIcon({ status, isOutgoing }: { status: string; isOutgoing: boolean }) {
  if (!isOutgoing) return null;
  
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 ml-0.5 opacity-70" />;
    case 'sent':
      return <Check className="w-3 h-3 ml-0.5 opacity-70" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 ml-0.5 opacity-70" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 ml-0.5 text-blue-400" />;
    case 'failed':
      return <AlertCircle className="w-3 h-3 ml-0.5 text-destructive" />;
    default:
      return <CheckCheck className="w-3 h-3 ml-0.5 opacity-70" />;
  }
}

// Emojis de reação rápida (padrão WhatsApp)
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, evolutionMessageId: string | null, emoji: string, messageDirection?: string) => void;
  onEdit?: (messageId: string, evolutionMessageId: string | null, newText: string) => Promise<boolean>;
  onDelete?: (messageId: string, evolutionMessageId: string | null) => Promise<boolean>;
  onRegisterLocation?: (lat: number, lng: number) => void;
  allMessages?: ChatMessage[];
}

export function ChatMessageBubble({ message, onReply, onReact, onEdit, onDelete, allMessages }: ChatMessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing';
  const time = format(new Date(message.timestamp), 'HH:mm');
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showActions, setShowActions] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Pode editar: mensagem de texto, saída, não do bot, com evolution_message_id
  const canEdit = isOutgoing && message.message_type === 'text' && !message.is_from_bot && !!message.evolution_message_id && !!onEdit;

  // Pode apagar: mensagem de saída com evolution_message_id (incluindo bot)
  const isDeleted = !!(message.metadata as any)?.deleted;
  const canDelete = isOutgoing && !!message.evolution_message_id && !!onDelete && !isDeleted;

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editing]);

  const handleStartEdit = useCallback(() => {
    setEditText(message.content || '');
    setEditing(true);
    setShowActions(false);
  }, [message.content]);

  const handleSaveEdit = useCallback(async () => {
    if (!editText.trim() || editText.trim() === message.content?.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const success = await onEdit!(message.id, message.evolution_message_id, editText.trim());
      if (success) {
        setEditing(false);
      }
    } finally {
      setEditSaving(false);
    }
  }, [editText, message.id, message.evolution_message_id, message.content, onEdit, editSaving]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setEditText('');
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const success = await onDelete!(message.id, message.evolution_message_id);
      if (success) {
        setDeleteConfirmOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  }, [message.id, message.evolution_message_id, onDelete, deleting]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

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

  // Buscar mensagem citada
  const quotedContent = message.quoted_content as { content?: string; sender_name?: string; message_type?: string } | null;
  const quotedMessage = message.quoted_message_id && allMessages
    ? allMessages.find(m => m.id === message.quoted_message_id)
    : null;

  const quotedDisplay = quotedContent || (quotedMessage ? {
    content: quotedMessage.content,
    sender_name: quotedMessage.sender_name || (quotedMessage.direction === 'outgoing' ? 'Você' : 'Cliente'),
    message_type: quotedMessage.message_type,
  } : null);

  // Reações
  const reactions = (message.reactions as Array<{ emoji: string; from?: string; from_me?: boolean }>) || [];
  const reactionGroups = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const renderMedia = () => {
    // Não renderizar mídia se a mensagem foi apagada
    if (isDeleted) return null;

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
                openLightbox();
              }}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="w-[90vw] h-[85vh] max-w-[90vw] max-h-[85vh] p-0 bg-black/95 border-none flex flex-col overflow-hidden">
                <div className="flex items-center justify-end gap-2 px-3 py-2 bg-black/80 border-b border-white/10 flex-shrink-0">
                  <button onClick={handleZoomOut} className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors" aria-label="Diminuir zoom">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-white/70 text-xs font-mono min-w-[4ch] text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={handleZoomIn} className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors" aria-label="Aumentar zoom">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button onClick={handleReset} className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors" aria-label="Resetar zoom">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <div className="w-px h-5 bg-white/20 mx-1" />
                  <button onClick={() => setLightboxOpen(false)} className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors" aria-label="Fechar">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div
                  className="flex-1 overflow-auto flex items-center justify-center"
                  style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
                  onWheel={handleWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <img
                    src={media_url}
                    alt="Imagem ampliada"
                    className="select-none"
                    draggable={false}
                    style={{
                      transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                      transition: dragging ? 'none' : 'transform 0.2s ease',
                      maxWidth: 'none',
                      maxHeight: 'none',
                    }}
                  />
                </div>
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
          <div className="mb-1">
            <audio
              src={media_url}
              controls
              crossOrigin="anonymous"
              preload="auto"
              className="max-w-full"
              style={{ height: '36px', minWidth: '200px' }}
            />
            {message.metadata?.transcription && (
              <div className={cn(
                "mt-1.5 px-2 py-1.5 rounded text-xs italic border-l-2",
                isOutgoing
                  ? "bg-white/10 border-white/30 text-primary-foreground/80"
                  : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
              )}>
                <span className="font-medium not-italic text-[10px] uppercase tracking-wider opacity-70 block mb-0.5">
                  Transcrição
                </span>
                {message.metadata.transcription}
              </div>
            )}
          </div>
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

      case 'location': {
        // Extrair coordenadas do content (formato: "📍 Localização: lat, lng")
        const coordMatch = message.content?.match(/([-\d.]+),\s*([-\d.]+)/);
        const lat = coordMatch?.[1];
        const lng = coordMatch?.[2];
        
        if (lat && lng) {
          const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          const handleCopyLink = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigator.clipboard.writeText(googleUrl);
          };

          return (
            <div className="w-[280px] mb-1 rounded-lg overflow-hidden border border-border/30">
              {/* Header com ícone */}
              <div className="bg-muted/50 px-3 py-3 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Localização</p>
                  <p className="text-xs text-muted-foreground truncate">{lat}, {lng}</p>
                </div>
              </div>
              {/* Botões */}
              <div className="grid grid-cols-2 gap-px bg-border/30">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-background hover:bg-muted/50 transition-colors text-center"
                >
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium">Google Maps</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-background hover:bg-muted/50 transition-colors text-center"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Copiar link</span>
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="text-base">📍</span>
            <span>Localização enviada</span>
          </div>
        );
      }

      case 'payment_request': {
        // Extrair dados do metadata
        const meta = message.metadata as any;
        const payAmount = meta?.amount;
        const payPixType = meta?.pix_type;
        const payInvoice = meta?.invoice_number;
        const payItemName = meta?.item_name;
        const formattedAmount = payAmount
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payAmount)
          : null;

        return (
          <div className="w-[280px] mb-1 rounded-lg overflow-hidden border border-border/30">
            <div className="bg-amber-100/50 dark:bg-amber-900/30 px-3 py-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Solicitação de Pagamento</p>
                {formattedAmount && (
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formattedAmount}</p>
                )}
              </div>
            </div>
            <div className="px-3 py-2 space-y-1 text-xs text-muted-foreground">
              {payPixType && <p>🔑 Tipo: {payPixType}</p>}
              {payItemName && <p>📦 {payItemName}</p>}
              {payInvoice && <p>🧾 Fatura: {payInvoice}</p>}
            </div>
          </div>
        );
      }

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

  const getQuotedTypeIcon = (type?: string) => {
    switch (type) {
      case 'image': return '📷 ';
      case 'video': return '🎥 ';
      case 'audio': return '🎵 ';
      case 'document': return '📄 ';
      default: return '';
    }
  };

  // Mensagem de sistema (transferência, etc.)
  if (message.direction === 'system' || message.message_type === 'system') {
    return (
      <div className="flex justify-center mb-2 px-4">
        <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1.5 rounded-lg max-w-[85%] text-center shadow-sm">
          {message.content}
          <span className="ml-2 text-[10px] opacity-60">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex mb-1 group', isOutgoing ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setReactOpen(false); }}
    >
      {/* Ações flutuantes */}
      {showActions && (
        <div className={cn(
          'flex items-center gap-0.5 self-center mx-1',
          isOutgoing ? 'order-first' : 'order-last'
        )}>
          {onReply && (
            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Responder"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
          {onReact && (
            <Popover open={reactOpen} onOpenChange={setReactOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Reagir"
                >
                  <SmilePlus className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-auto p-1.5 flex gap-1">
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, message.evolution_message_id, emoji, message.direction);
                      setReactOpen(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {canEdit && !editing && (
            <button
              onClick={handleStartEdit}
              className="p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Editar mensagem"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { setDeleteConfirmOpen(true); setShowActions(false); }}
              className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Apagar mensagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="relative max-w-[75%]">
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isOutgoing
              ? 'bg-chat-outgoing text-chat-outgoing-foreground rounded-br-sm'
              : 'bg-card border border-border rounded-bl-sm'
          )}
        >
          {/* Indicador de origem da mensagem */}
          {isOutgoing && message.is_from_bot && (
            <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
              <Bot className="w-3 h-3" /> Bot IA
            </div>
          )}
          {isOutgoing && !message.is_from_bot && message.message_source === 'cellphone' && (
            <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
              <Smartphone className="w-3 h-3" /> Celular
            </div>
          )}
          {isOutgoing && !message.is_from_bot && message.message_source === 'system' && message.sender_name && (
            <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
              <Monitor className="w-3 h-3" /> {message.sender_name}
            </div>
          )}
          {isOutgoing && !message.is_from_bot && message.message_source !== 'cellphone' && message.message_source !== 'system' && message.sender_name && (
            <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
              👤 {message.sender_name}
            </div>
          )}

          {/* Citação / Resposta */}
          {quotedDisplay && (
            <div
              className={cn(
                "rounded px-2 py-1.5 mb-1.5 border-l-3 text-xs cursor-pointer",
                isOutgoing
                  ? "bg-white/10 border-l-white/50"
                  : "bg-muted/60 border-l-primary/50"
              )}
              style={{ borderLeftWidth: '3px' }}
            >
              <p className={cn(
                "font-semibold text-[10px] mb-0.5",
                isOutgoing ? "text-primary-foreground/80" : "text-primary"
              )}>
                {quotedDisplay.sender_name || 'Mensagem'}
              </p>
              <p className={cn(
                "truncate",
                isOutgoing ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                {getQuotedTypeIcon(quotedDisplay.message_type)}
                {quotedDisplay.content || '[mídia]'}
              </p>
            </div>
          )}

          {/* Mídia */}
          {renderMedia()}

          {/* Conteúdo de texto (oculta nomes de arquivo para áudio) */}
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full min-h-[60px] rounded bg-background/20 border border-primary-foreground/30 text-primary-foreground px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-foreground/50"
                disabled={editSaving}
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  disabled={editSaving}
                  className="text-[11px] px-2 py-0.5 rounded bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving || !editText.trim() || editText.trim() === message.content?.trim()}
                  className="text-[11px] px-2 py-0.5 rounded bg-primary-foreground/30 hover:bg-primary-foreground/40 text-primary-foreground transition-colors disabled:opacity-50"
                >
                  {editSaving ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : message.content && !(message.message_type === 'audio' && /^audio_\d+\.\w+$/.test(message.content.trim())) && (
            <div>
              <span className="whitespace-pre-wrap break-words">{message.content}</span>
              {(message.metadata as any)?.edited && (
                <div className="mt-1">
                  <span className={cn("text-[10px] italic", isOutgoing ? "opacity-60" : "text-muted-foreground")}>editada</span>
                  {!isOutgoing && (message.metadata as any)?.original_content && (
                    <div className={cn(
                      "mt-1 px-2 py-1 rounded text-[11px] italic border-l-2",
                      "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
                    )}>
                      <span className="font-medium text-[10px] block mb-0.5">Mensagem original:</span>
                      {(message.metadata as any).original_content}
                    </div>
                  )}
                </div>
              )}
              {/* Espaçador invisível para reservar espaço do horário inline */}
              <span className="inline-block w-[60px]" />
            </div>
          )}

          {/* Hora e status de envio - posicionado dentro do balão */}
          <span
            className={cn(
              'text-[10px] flex items-center gap-0.5 float-right -mt-4 relative',
              isOutgoing ? 'opacity-70' : 'text-muted-foreground'
            )}
          >
            {time}
            {isOutgoing && (
              <MessageStatusIcon status={message.status} isOutgoing={isOutgoing} />
            )}
          </span>
        </div>

        {/* Reações abaixo da bolha */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 -mt-1 relative z-10",
            isOutgoing ? "justify-end mr-1" : "justify-start ml-1"
          )}>
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm"
              >
                {emoji}{count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A mensagem será apagada para todos no WhatsApp. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Apagando...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
