import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, Target } from "lucide-react";

interface BonusTier {
  id: string;
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
  is_active: boolean;
}

interface EditValues {
  min_sales: number;
  bonus_amount: number;
}

interface BonusTierCardProps {
  tier: BonusTier;
  isEditing: boolean;
  editValues: EditValues;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValuesChange: (values: EditValues) => void;
  formatCurrency: (value: number) => string;
}

const getTierColor = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'bronze':
      return 'bg-amber-500/10 border-amber-500/30';
    case 'prata':
      return 'bg-slate-400/10 border-slate-400/30';
    case 'ouro':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'diamante':
      return 'bg-cyan-500/10 border-cyan-500/30';
    default:
      return 'bg-muted border-border';
  }
};

const getTierTextColor = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'bronze':
      return 'text-amber-700 dark:text-amber-400';
    case 'prata':
      return 'text-slate-600 dark:text-slate-300';
    case 'ouro':
      return 'text-yellow-700 dark:text-yellow-400';
    case 'diamante':
      return 'text-cyan-700 dark:text-cyan-400';
    default:
      return 'text-foreground';
  }
};

const getTierEmoji = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'bronze':
      return '🥉';
    case 'prata':
      return '🥈';
    case 'ouro':
      return '🥇';
    case 'diamante':
      return '💎';
    default:
      return '🏆';
  }
};

export function BonusTierCard({
  tier,
  isEditing,
  editValues,
  onEdit,
  onSave,
  onCancel,
  onEditValuesChange,
  formatCurrency,
}: BonusTierCardProps) {
  return (
    <div className={`p-3 border rounded-lg ${getTierColor(tier.tier_name)}`}>
      {/* Header: Nome do Tier + Botão Editar */}
      <div className="flex items-center justify-between mb-3">
        <span className={`font-semibold text-sm flex items-center gap-1.5 ${getTierTextColor(tier.tier_name)}`}>
          {getTierEmoji(tier.tier_name)} {tier.tier_name}
        </span>
        {!isEditing && (
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 w-7 p-0">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        /* Modo Edição */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Mín. Vendas</Label>
              <Input
                type="number"
                min="1"
                value={editValues.min_sales}
                onChange={(e) =>
                  onEditValuesChange({
                    ...editValues,
                    min_sales: parseInt(e.target.value) || 0,
                  })
                }
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editValues.bonus_amount}
                onChange={(e) =>
                  onEditValuesChange({
                    ...editValues,
                    bonus_amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="flex-1 h-8">
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 h-8">
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        /* Modo Visualização */
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {tier.min_sales} vendas
            </span>
          </div>
          <div className="text-right">
            <p className={`font-bold text-base ${getTierTextColor(tier.tier_name)}`}>
              {formatCurrency(tier.bonus_amount)}
            </p>
            <p className="text-[10px] text-muted-foreground">Bônus</p>
          </div>
        </div>
      )}
    </div>
  );
}
