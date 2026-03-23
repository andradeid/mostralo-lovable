import { ReactNode, useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { Plus, MoreVertical, Pencil, Trash2, Search, Filter, TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialTransaction } from '@/hooks/useFinancialTransactions';
import { FinancialCategory } from '@/hooks/useFinancialCategories';
import { cn } from '@/lib/utils';

interface TransactionsListProps {
  transactions: Array<FinancialTransaction & { is_auto?: boolean }>;
  categories: FinancialCategory[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (transaction: FinancialTransaction & { is_auto?: boolean }) => void;
  onDelete: (id: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  originFilter?: 'all' | 'manual' | 'auto';
  onOriginFilterChange?: (value: 'all' | 'manual' | 'auto') => void;
  extraActions?: ReactNode;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência',
  check: 'Cheque',
  other: 'Outro',
};

function getOriginLabel(tx: FinancialTransaction & { is_auto?: boolean }): string {
  if (tx.is_auto) return 'Agendamento';
  if (tx.order_id) return 'Pedido';
  return 'Manual';
}

function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
}

// Group transactions by date
function groupByDate(transactions: Array<FinancialTransaction & { is_auto?: boolean }>) {
  const groups: Record<string, Array<FinancialTransaction & { is_auto?: boolean }>> = {};
  for (const tx of transactions) {
    const key = tx.transaction_date.split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export function TransactionsList({
  transactions,
  categories,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchTerm,
  onSearchChange,
  originFilter,
  onOriginFilterChange,
  extraActions,
}: TransactionsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const showOriginFilter = !!originFilter && !!onOriginFilterChange;

  // Summary KPIs
  const summary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [transactions]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage, pageSize]);

  const grouped = useMemo(() => groupByDate(paginatedTransactions), [paginatedTransactions]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [typeFilter, categoryFilter, searchTerm, originFilter]);

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
        <Card className="border-green-500/20 bg-green-500/[0.03]">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Entradas</p>
              <p className="text-sm md:text-lg font-bold text-green-500 truncate">{formatCurrency(summary.totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Saídas</p>
              <p className="text-sm md:text-lg font-bold text-red-500 truncate">{formatCurrency(summary.totalExpense)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/[0.03]">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Saldo</p>
              <p className={cn(
                "text-sm md:text-lg font-bold truncate",
                summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'
              )}>{formatCurrency(summary.balance)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Filters */}
      <Card>
        <CardContent className="p-3 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="text-base md:text-lg font-semibold">Transações</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              {extraActions}
              <Button onClick={onAdd} size="sm" className="w-full sm:w-auto h-8 md:h-9 text-xs md:text-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova Transação
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-8 md:h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className="w-[120px] h-8 text-xs md:text-sm">
                  <Filter className="h-3 w-3 mr-1.5" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs md:text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOriginFilter && (
                <Select value={originFilter} onValueChange={(v) => onOriginFilterChange(v as any)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs md:text-sm">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Grouped Transactions */}
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Ajuste os filtros ou adicione uma nova transação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([dateKey, txs]) => (
                <div key={dateKey}>
                  {/* Date Group Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {getDateGroupLabel(dateKey)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {txs.length} {txs.length === 1 ? 'transação' : 'transações'}
                    </span>
                  </div>

                  {/* Transaction Rows */}
                  <div className="space-y-1.5">
                    {txs.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onEdit={onEdit}
                        onDelete={(id) => setDeleteId(id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.
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

// Individual transaction row component
function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: FinancialTransaction & { is_auto?: boolean };
  onEdit: (tx: FinancialTransaction & { is_auto?: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const isIncome = tx.type === 'income';
  const origin = getOriginLabel(tx);

  return (
    <div className={cn(
      "group flex items-center gap-3 p-2.5 md:p-3 rounded-lg border transition-colors hover:bg-muted/50",
      isIncome ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500'
    )}>
      {/* Icon */}
      <div className={cn(
        "hidden sm:flex h-9 w-9 rounded-lg items-center justify-center shrink-0",
        isIncome ? 'bg-green-500/10' : 'bg-red-500/10'
      )}>
        {isIncome ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-1 md:gap-4 md:items-center">
        {/* Description + meta */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{tx.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10px] md:text-xs text-muted-foreground">
              {format(new Date(tx.transaction_date), "HH:mm", { locale: ptBR })}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <Badge 
              variant="outline" 
              className="text-[10px] md:text-xs h-5 px-1.5"
              style={{ borderColor: tx.category?.color, color: tx.category?.color }}
            >
              {tx.category?.name || 'Sem categoria'}
            </Badge>
            <Badge variant="secondary" className="text-[10px] md:text-xs h-5 px-1.5">
              {origin}
            </Badge>
            {tx.is_auto && (
              <Badge variant="secondary" className="text-[10px] md:text-xs h-5 px-1.5 bg-blue-500/10 text-blue-500 border-blue-500/20">
                AUTO
              </Badge>
            )}
          </div>
        </div>

        {/* Payment method - desktop */}
        <div className="hidden md:block">
          {tx.payment_method ? (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {paymentMethodLabels[tx.payment_method] || tx.payment_method}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </div>

        {/* Category color dot - desktop only for visual scannability */}
        <div className="hidden md:block" />

        {/* Value - always visible */}
        <div className="md:text-right">
          <span className={cn(
            "text-sm md:text-base font-bold whitespace-nowrap",
            isIncome ? 'text-green-500' : 'text-red-500'
          )}>
            {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(tx)} disabled={!!tx.is_auto}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => !tx.is_auto && onDelete(tx.id)}
            disabled={!!tx.is_auto}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
