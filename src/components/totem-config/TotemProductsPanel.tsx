import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TotemConfig } from '@/hooks/useTotemConfig';

interface TotemProductsPanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
}

export function TotemProductsPanel({ config, onChange }: TotemProductsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Tamanho dos Cards de Produto</Label>
        <Select
          value={config.product_card_size || 'medium'}
          onValueChange={(value) => onChange({ product_card_size: value as 'small' | 'medium' | 'large' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Posição das Categorias</Label>
        <Select
          value={config.categories_position || 'top'}
          onValueChange={(value) => onChange({ categories_position: value as 'top' | 'left' | 'hidden' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Topo (horizontal)</SelectItem>
            <SelectItem value="left">Lateral esquerda (vertical)</SelectItem>
            <SelectItem value="hidden">Ocultas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Posição do Carrinho</Label>
        <Select
          value={config.cart_position || 'bottom'}
          onValueChange={(value) => onChange({ cart_position: value as 'bottom' | 'right' | 'floating' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom">Parte inferior (fixa)</SelectItem>
            <SelectItem value="right">Lateral direita</SelectItem>
            <SelectItem value="floating">Flutuante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Exibir Descrição do Produto</Label>
          <p className="text-sm text-muted-foreground">Mostrar descrição nos cards</p>
        </div>
        <Switch
          checked={config.show_product_description ?? true}
          onCheckedChange={(checked) => onChange({ show_product_description: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Exibir Imagens dos Produtos</Label>
          <p className="text-sm text-muted-foreground">Mostrar fotos nos cards</p>
        </div>
        <Switch
          checked={config.show_product_images ?? true}
          onCheckedChange={(checked) => onChange({ show_product_images: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Permitir Observações nos Itens</Label>
          <p className="text-sm text-muted-foreground">Cliente pode adicionar notas aos produtos</p>
        </div>
        <Switch
          checked={config.show_item_notes ?? true}
          onCheckedChange={(checked) => onChange({ show_item_notes: checked })}
        />
      </div>
    </div>
  );
}
