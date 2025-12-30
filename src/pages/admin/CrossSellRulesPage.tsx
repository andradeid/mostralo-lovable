import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useCrossSell } from '@/hooks/useCrossSell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  trigger_category_id: string;
  suggest_category_id: string;
  priority: number;
  max_suggestions: number;
  discount_percentage: number | null;
  is_active: boolean;
  trigger_category?: { name: string };
  suggest_category?: { name: string };
}

export default function CrossSellRulesPage() {
  const { storeId } = useStoreAccess();
  const { fetchRules, createRule, updateRule, deleteRule } = useCrossSell(storeId);
  
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [triggerCategoryId, setTriggerCategoryId] = useState('');
  const [suggestCategoryId, setSuggestCategoryId] = useState('');
  const [priority, setPriority] = useState('1');
  const [maxSuggestions, setMaxSuggestions] = useState('3');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!storeId
  });

  useEffect(() => {
    loadRules();
  }, [storeId]);

  const loadRules = async () => {
    setLoading(true);
    const data = await fetchRules();
    setRules(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTriggerCategoryId('');
    setSuggestCategoryId('');
    setPriority('1');
    setMaxSuggestions('3');
    setDiscountPercentage('');
    setIsActive(true);
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule);
      setTriggerCategoryId(rule.trigger_category_id);
      setSuggestCategoryId(rule.suggest_category_id);
      setPriority(rule.priority.toString());
      setMaxSuggestions(rule.max_suggestions.toString());
      setDiscountPercentage(rule.discount_percentage?.toString() || '');
      setIsActive(rule.is_active);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!triggerCategoryId || !suggestCategoryId) {
      toast.error('Selecione as categorias');
      return;
    }

    if (triggerCategoryId === suggestCategoryId) {
      toast.error('As categorias devem ser diferentes');
      return;
    }

    setSaving(true);
    try {
      const ruleData = {
        trigger_category_id: triggerCategoryId,
        suggest_category_id: suggestCategoryId,
        priority: parseInt(priority) || 1,
        max_suggestions: parseInt(maxSuggestions) || 3,
        discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
        is_active: isActive
      };

      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
        toast.success('Regra atualizada com sucesso');
      } else {
        await createRule(ruleData);
        toast.success('Regra criada com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      loadRules();
    } catch (err) {
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    const success = await deleteRule(ruleId);
    if (success) {
      toast.success('Regra excluída');
      loadRules();
    } else {
      toast.error('Erro ao excluir regra');
    }
  };

  const handleToggleActive = async (rule: Rule) => {
    const success = await updateRule(rule.id, { is_active: !rule.is_active });
    if (success) {
      loadRules();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regras de Cross-sell</h1>
          <p className="text-muted-foreground">
            Configure sugestões de produtos com base nas categorias do carrinho
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma regra configurada</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira regra
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando comprar</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Sugerir</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.trigger_category?.name || 'Categoria não encontrada'}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      {rule.suggest_category?.name || 'Categoria não encontrada'}
                    </TableCell>
                    <TableCell>
                      {rule.discount_percentage ? (
                        <Badge variant="secondary">{rule.discount_percentage}% OFF</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{rule.max_suggestions}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Cross-sell'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quando o cliente adicionar da categoria</Label>
              <Select value={triggerCategoryId} onValueChange={setTriggerCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria gatilho" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sugerir produtos da categoria</Label>
              <Select value={suggestCategoryId} onValueChange={setSuggestCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria para sugerir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Menor = maior prioridade</p>
              </div>

              <div className="space-y-2">
                <Label>Máximo de sugestões</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={maxSuggestions}
                  onChange={(e) => setMaxSuggestions(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Desconto (%) - Opcional</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Ex: 10"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Aplica desconto automático nos produtos sugeridos
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Regra ativa</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
