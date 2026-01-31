import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Star
} from 'lucide-react';
import { MasterFaqItem } from '@/hooks/useMasterFaq';
import { cn } from '@/lib/utils';

interface FaqItemCardProps {
  faq: MasterFaqItem;
  onEdit: (faq: MasterFaqItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const categoryColors = {
  sales: 'bg-green-500/10 text-green-600 border-green-500/30',
  support: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  recruitment: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

const categoryLabels = {
  sales: '💰 Vendas',
  support: '🎧 Suporte',
  recruitment: '👥 Recrutamento',
};

export function FaqItemCard({ faq, onEdit, onDelete, onToggleActive }: FaqItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={cn(
      "transition-all duration-200",
      !faq.is_active && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={cn("text-xs", categoryColors[faq.category])}>
                  {categoryLabels[faq.category]}
                </Badge>
                {faq.priority >= 8 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="w-3 h-3" />
                    Alta prioridade
                  </Badge>
                )}
              </div>
              <h4 className="font-medium text-sm line-clamp-2">
                {faq.question}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={faq.is_active}
                onCheckedChange={(checked) => onToggleActive(faq.id, checked)}
              />
            </div>
          </div>

          {/* Answer Preview */}
          <div 
            className={cn(
              "text-sm text-muted-foreground",
              !expanded && "line-clamp-2"
            )}
          >
            {faq.answer}
          </div>

          {/* Keywords */}
          {faq.keywords && faq.keywords.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {faq.keywords.slice(0, expanded ? undefined : 5).map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {keyword}
                </Badge>
              ))}
              {!expanded && faq.keywords.length > 5 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{faq.keywords.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Expandir
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(faq)}
                className="text-xs gap-1"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(faq.id)}
                className="text-xs gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
