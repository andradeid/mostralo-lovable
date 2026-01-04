import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Rocket, Bug, Zap, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageGallery } from './ImageGallery';

interface UpdateImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'improvement' | 'security';
  importance: 'normal' | 'important' | 'critical';
  release_date: string;
  is_published: boolean;
  system_update_images?: UpdateImage[];
}

interface UpdateCardProps {
  update: SystemUpdate;
  isRead?: boolean;
  onMarkAsRead?: (id: string) => void;
  showActions?: boolean;
}

const categoryConfig = {
  feature: { icon: Rocket, label: 'Nova Funcionalidade', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  fix: { icon: Bug, label: 'Correção', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  improvement: { icon: Zap, label: 'Melhoria', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  security: { icon: Shield, label: 'Segurança', color: 'bg-red-500/10 text-red-600 border-red-500/20' }
};

const importanceConfig = {
  normal: null,
  important: { label: 'IMPORTANTE', color: 'bg-yellow-500 text-white' },
  critical: { label: 'CRÍTICO', color: 'bg-red-500 text-white' }
};

// Simple markdown renderer
function MarkdownRenderer({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    // Convert markdown to HTML-like elements
    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-2">')
      // List items
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    
    return `<p class="mb-2">${html}</p>`;
  };

  return (
    <div 
      className="text-sm text-muted-foreground space-y-1"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export function UpdateCard({ update, isRead = true, onMarkAsRead, showActions = true }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(true);
  const category = categoryConfig[update.category];
  const importance = importanceConfig[update.importance];
  const CategoryIcon = category.icon;
  const images = update.system_update_images || [];

  const formattedDate = new Date(update.release_date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Card className={`transition-all ${!isRead ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {!isRead && (
              <Badge variant="default" className="bg-primary animate-pulse">
                🆕 NOVO
              </Badge>
            )}
            <Badge variant="outline" className="font-mono">
              {update.version}
            </Badge>
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
            {importance && (
              <Badge className={importance.color}>
                {importance.label}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={category.color}>
            <CategoryIcon className="h-3 w-3 mr-1" />
            {category.label}
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold mt-2">{update.title}</h3>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <MarkdownRenderer content={update.description} />

          {images.length > 0 && (
            <div className="mt-4">
              <ImageGallery images={images} />
            </div>
          )}

          {showActions && !isRead && onMarkAsRead && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(update.id)}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Marcar como lido
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
