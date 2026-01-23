import { ReactNode, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { Plus, MoreVertical, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
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

  const showOriginFilter = !!originFilter && !!onOriginFilterChange;
  const originLabel = useMemo(() => {
    if (!originFilter) return 'Origem';
    if (originFilter === 'manual') return 'Manual';
    if (originFilter === 'auto') return 'Automático';
    return 'Todas';
  }, [originFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Transferência',
    check: 'Cheque',
    other: 'Outro',
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 md:h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3 md:p-6 pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Transações</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {extraActions}
            <Button onClick={onAdd} size="sm" className="w-full sm:w-auto h-8 md:h-9 text-xs md:text-sm">
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {/* Filtros */}
          <div className="flex flex-col gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 md:pl-9 h-8 md:h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className="flex-1 sm:w-[130px] sm:flex-none h-8 md:h-9 text-xs md:text-sm">
                  <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="flex-1 sm:w-[150px] sm:flex-none h-8 md:h-9 text-xs md:text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOriginFilter && (
                <Select value={originFilter} onValueChange={(v) => onOriginFilterChange(v as any)}>
                  <SelectTrigger className="flex-1 sm:w-[150px] sm:flex-none h-8 md:h-9 text-xs md:text-sm">
                    <SelectValue placeholder="Origem">{originLabel}</SelectValue>
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

          {/* Lista Mobile */}
          <div className="md:hidden space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground border rounded-md">
                Nenhuma transação encontrada
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={cn(
                        "font-semibold text-sm whitespace-nowrap",
                        tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                      )}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(tx)} disabled={!!tx.is_auto}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => !tx.is_auto && setDeleteId(tx.id)}
                            disabled={!!tx.is_auto}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: tx.category?.color, color: tx.category?.color }}
                    >
                      {tx.category?.name || 'Sem categoria'}
                    </Badge>
                    {tx.is_auto ? (
                      <Badge variant="secondary" className="text-xs">
                        AUTO
                      </Badge>
                    ) : null}
                    {tx.payment_method && (
                      <span className="text-xs text-muted-foreground">
                        {paymentMethodLabels[tx.payment_method]}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Data</TableHead>
                  <TableHead className="text-sm">Descrição</TableHead>
                  <TableHead className="text-sm">Categoria</TableHead>
                  <TableHead className="text-sm hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="text-sm text-right">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(tx.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm" title={tx.description}>
                          {tx.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: tx.category?.color, color: tx.category?.color }}
                        >
                          {tx.category?.name || 'Sem categoria'}
                        </Badge>
                        {tx.is_auto ? (
                          <Badge variant="secondary" className="ml-2">
                            AUTO
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">
                        {tx.payment_method ? paymentMethodLabels[tx.payment_method] : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                        )}>
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(tx)} disabled={!!tx.is_auto}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => !tx.is_auto && setDeleteId(tx.id)}
                              disabled={!!tx.is_auto}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir esta transação?
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
