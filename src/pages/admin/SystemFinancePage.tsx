import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, ArrowLeftRight, Tags } from 'lucide-react';
import { FinancialKPICards } from '@/components/admin/financial/FinancialKPICards';
import { FinancialChart } from '@/components/admin/financial/FinancialChart';
import { TransactionsList } from '@/components/admin/financial/TransactionsList';
import { SystemTransactionForm, SystemTransactionFormValues } from '@/components/admin/financial/SystemTransactionForm';
import { CategoriesManager } from '@/components/admin/financial/CategoriesManager';
import { useSystemFinancialCategories } from '@/hooks/useSystemFinancialCategories';
import { useSystemFinancialTransactions } from '@/hooks/useSystemFinancialTransactions';
import { useSystemFinancialSummary } from '@/hooks/useSystemFinancialSummary';
import type { FinancialTransaction } from '@/hooks/useFinancialTransactions';

export default function SystemFinancePage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const {
    categories,
    incomeCategories,
    expenseCategories,
    isLoading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useSystemFinancialCategories();

  const transactionFilters = useMemo(
    () => ({
      type: typeFilter !== 'all' ? (typeFilter as 'income' | 'expense') : undefined,
      categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm || undefined,
    }),
    [typeFilter, categoryFilter, searchTerm]
  );

  const {
    transactions,
    isLoading: transactionsLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating: isCreatingTransaction,
    isUpdating: isUpdatingTransaction,
  } = useSystemFinancialTransactions(transactionFilters);

  const { totalIncome, totalExpense, balance, monthlyData, isLoading: summaryLoading } =
    useSystemFinancialSummary(6);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: SystemTransactionFormValues) => {
    const payload = {
      category_id: data.category_id,
      type: data.type,
      amount: parseFloat(data.amount),
      description: data.description,
      notes: data.notes,
      transaction_date: data.transaction_date,
      payment_method: data.payment_method || undefined,
      reference_number: data.reference_number || undefined,
      vendor: data.vendor || undefined,
    };

    if (editingTransaction) {
      updateTransaction({ id: editingTransaction.id, ...payload });
    } else {
      createTransaction(payload);
    }

    setFormOpen(false);
    setEditingTransaction(null);
  };

  const handleCreateCategory = (data: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
    description?: string;
  }) => {
    createCategory({
      name: data.name,
      type: data.type,
      color: data.color,
      description: data.description,
    });
  };

  const handleUpdateCategory = (data: {
    id: string;
    name?: string;
    icon?: string;
    color?: string;
    description?: string;
  }) => {
    updateCategory({
      id: data.id,
      name: data.name,
      color: data.color,
      description: data.description,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <header>
        <h1 className="text-xl md:text-2xl font-bold">Finanças do Sistema</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Registre receitas (ex.: setup) e despesas (VPS, Supabase, ferramentas) da plataforma.
        </p>
      </header>

      <main>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 md:h-10 lg:w-[420px]">
            <TabsTrigger value="dashboard" className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <LayoutDashboard className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <ArrowLeftRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Tags className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <FinancialKPICards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              isLoading={summaryLoading}
            />
            <FinancialChart data={monthlyData} isLoading={summaryLoading} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-4 md:mt-6">
            <TransactionsList
              transactions={transactions}
              categories={categories}
              isLoading={transactionsLoading}
              onAdd={handleAddTransaction}
              onEdit={handleEditTransaction}
              onDelete={deleteTransaction}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </TabsContent>

          <TabsContent value="categories" className="mt-4 md:mt-6">
            <CategoriesManager
              categories={categories}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              isLoading={categoriesLoading}
              onCreate={handleCreateCategory}
              onUpdate={handleUpdateCategory}
              onDelete={deleteCategory}
              storeId=""
            />
          </TabsContent>
        </Tabs>

        <SystemTransactionForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleFormSubmit}
          transaction={editingTransaction}
          categories={categories}
          isLoading={isCreatingTransaction || isUpdatingTransaction}
        />
      </main>
    </div>
  );
}
