import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Pencil, Trash2, Lock, TrendingUp, TrendingDown, Search, ArrowRight, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialCategory } from '@/hooks/useFinancialCategories';
import { FinancialTransaction } from '@/hooks/useFinancialTransactions';
import { CategoryForm } from './CategoryForm';
import { cn } from '@/lib/utils';

interface CategoriesManagerProps {
  categories: FinancialCategory[];
  incomeCategories: FinancialCategory[];
  expenseCategories: FinancialCategory[];
  isLoading?: boolean;
  onCreate: (data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string; description?: string }) => void;
  onUpdate: (data: { id: string; name?: string; icon?: string; color?: string; description?: string }) => void;
  onDelete: (id: string) => void;
  storeId: string;
  transactions?: FinancialTransaction[];
  onViewTransactions?: (categoryId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface CategoryStats {
  total: number;
  count: number;
  lastUsed: string | null;
}

function computeCategoryStats(
  categories: FinancialCategory[],
  transactions: FinancialTransaction[]
): Record<string, CategoryStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const stats: Record<string, CategoryStats> = {};
  for (const cat of categories) {
    stats[cat.id] = { total: 0, count: 0, lastUsed: null };
  }

  for (const tx of transactions) {
    if (!stats[tx.category_id]) continue;
    // Count all transactions for lastUsed
    const current = stats[tx.category_id];
    if (!current.lastUsed || tx.transaction_date > current.lastUsed) {
      current.lastUsed = tx.transaction_date;
    }
    // Only count current month for totals
    if (tx.transaction_date >= monthStart) {
      current.total += tx.amount;
      current.count += 1;
    }
  }

  return stats;
}

export function CategoriesManager({
  categories,
  incomeCategories,
  expenseCategories,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  storeId,
  transactions = [],
  onViewTransactions,
}: CategoriesManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => computeCategoryStats(categories, transactions), [categories, transactions]);

  const handleAdd = (type: 'income' | 'expense') => {
    setFormType(type);
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: FinancialCategory) => {
    setFormType(category.type);
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: { name: string; icon?: string; color?: string; description?: string }) => {
    if (editingCategory) {
      onUpdate({ id: editingCategory.id, ...data });
    } else {
      onCreate({ ...data, type: formType });
    }
    setFormOpen(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const filterCategories = (cats: FinancialCategory[]) => {
    if (!searchTerm) return cats;
    const term = searchTerm.toLowerCase();
    return cats.filter(c => c.name.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term));
  };

  // Summary KPIs
  const incomeTotalMonth = useMemo(() =>
    incomeCategories.reduce((s, c) => s + (stats[c.id]?.total || 0), 0), [incomeCategories, stats]);
  const expenseTotalMonth = useMemo(() =>
    expenseCategories.reduce((s, c) => s + (stats[c.id]?.total || 0), 0), [expenseCategories, stats]);

  const renderCategoryList = (cats: FinancialCategory[], type: 'income' | 'expense') => {
    const filtered = filterCategories(cats);
    const totalMonth = type === 'income' ? incomeTotalMonth : expenseTotalMonth;

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8">
          <Tag className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filtered.map((cat) => {
          const catStats = stats[cat.id] || { total: 0, count: 0, lastUsed: null };
          const percentage = totalMonth > 0 ? (catStats.total / totalMonth) * 100 : 0;

          return (
            <div
              key={cat.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                type === 'income' ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500'
              )}
            >
              {/* Color dot */}
              <div
                className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  {cat.is_system && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      Sistema
                    </Badge>
                  )}
                </div>
                {cat.description && (
                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">{cat.description}</p>
                )}
                {/* Usage info */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {catStats.count > 0 ? (
                    <>
                      <span className="text-[10px] text-muted-foreground">
                        {catStats.count} {catStats.count === 1 ? 'transação' : 'transações'} este mês
                      </span>
                      {catStats.lastUsed && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-[10px] text-muted-foreground">
                            Último uso: {format(new Date(catStats.lastUsed), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      {catStats.lastUsed
                        ? `Sem uso este mês · Último: ${format(new Date(catStats.lastUsed), "dd/MM/yyyy", { locale: ptBR })}`
                        : 'Nunca utilizada'}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                <span className={cn(
                  "text-sm font-bold",
                  catStats.total > 0
                    ? type === 'income' ? 'text-green-500' : 'text-red-500'
                    : 'text-muted-foreground/40'
                )}>
                  {catStats.total > 0 ? formatCurrency(catStats.total) : 'R$ 0,00'}
                </span>
                {percentage > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Mobile value */}
              <div className="sm:hidden shrink-0">
                <span className={cn(
                  "text-xs font-bold",
                  catStats.total > 0
                    ? type === 'income' ? 'text-green-500' : 'text-red-500'
                    : 'text-muted-foreground/40'
                )}>
                  {formatCurrency(catStats.total)}
                </span>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!cat.is_system && (
                    <DropdownMenuItem onClick={() => handleEdit(cat)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onViewTransactions && (
                    <DropdownMenuItem onClick={() => onViewTransactions(cat.id)}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ver transações
                    </DropdownMenuItem>
                  )}
                  {!cat.is_system && (
                    <DropdownMenuItem
                      onClick={() => setDeleteId(cat.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4">
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground">Despesas no mês</p>
            <p className="text-lg md:text-xl font-bold text-red-500">{formatCurrency(expenseTotalMonth)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{expenseCategories.length} categorias</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/[0.03]">
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground">Receitas no mês</p>
            <p className="text-lg md:text-xl font-bold text-green-500">{formatCurrency(incomeTotalMonth)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{incomeCategories.length} categorias</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3 md:p-5">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 md:h-9 text-sm"
            />
          </div>

          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 h-9">
              <TabsTrigger value="expense" className="gap-1.5 text-xs md:text-sm">
                <TrendingDown className="h-3.5 w-3.5" />
                Despesas ({expenseCategories.length})
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-1.5 text-xs md:text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                Receitas ({incomeCategories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense">
              <div className="flex justify-end mb-3">
                <Button onClick={() => handleAdd('expense')} size="sm" className="h-8 text-xs md:text-sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nova Despesa
                </Button>
              </div>
              {renderCategoryList(expenseCategories, 'expense')}
            </TabsContent>

            <TabsContent value="income">
              <div className="flex justify-end mb-3">
                <Button onClick={() => handleAdd('income')} size="sm" className="h-8 text-xs md:text-sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nova Receita
                </Button>
              </div>
              {renderCategoryList(incomeCategories, 'income')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <CategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        type={formType}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza? Não será possível excluir se houver transações vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-9 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="w-full sm:w-auto h-9 text-sm bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
