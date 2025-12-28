import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tags, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerLabel {
  id: string;
  name: string;
  color: string;
  label_type: string | null;
}

interface LabelFilterDropdownProps {
  labels: CustomerLabel[];
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
}

export function LabelFilterDropdown({
  labels,
  selectedLabelIds,
  onSelectionChange,
}: LabelFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  // Agrupar por tipo
  const groupedLabels = labels.reduce((acc, label) => {
    const type = label.label_type || 'custom';
    if (!acc[type]) acc[type] = [];
    acc[type].push(label);
    return acc;
  }, {} as Record<string, CustomerLabel[]>);

  const typeLabels: Record<string, string> = {
    origin: 'Origem',
    channel: 'Canal',
    custom: 'Personalizadas',
  };

  const handleToggle = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onSelectionChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onSelectionChange([...selectedLabelIds, labelId]);
    }
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            selectedLabelIds.length > 0 && 'border-primary'
          )}
        >
          <Tags className="h-4 w-4" />
          Etiquetas
          {selectedLabelIds.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedLabelIds.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtrar por etiquetas</span>
            {selectedLabelIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-2 space-y-3">
          {Object.entries(groupedLabels).map(([type, typeLabelsArr]) => (
            <div key={type}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {typeLabels[type] || type}
              </p>
              <div className="space-y-1">
                {typeLabelsArr.map((label) => (
                  <label
                    key={label.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedLabelIds.includes(label.id)}
                      onCheckedChange={() => handleToggle(label.id)}
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm truncate">{label.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {labels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma etiqueta disponível
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
