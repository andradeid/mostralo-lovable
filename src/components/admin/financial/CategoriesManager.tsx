import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Pencil, Trash2, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialCategory } from '@/hooks/useFinancialCategories';
import { CategoryForm } from './CategoryForm';

interface CategoriesManagerProps {
  categories: FinancialCategory[];
  incomeCategories: FinancialCategory[];
  expenseCategories: FinancialCategory[];
  isLoading?: boolean;
  onCreate: (data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string; description?: string }) => void;
  onUpdate: (data: { id: string; name?: string; icon?: string; color?: string; description?: string }) => void;
  onDelete: (id: string) => void;
  storeId: string;
}

export function CategoriesManager({
  incomeCategories,
  expenseCategories,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  storeId,
}: CategoriesManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');

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

  const renderCategoryTable = (categories: FinancialCategory[], type: 'income' | 'expense') => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs md:text-sm w-[50px]">Cor</TableHead>
            <TableHead className="text-xs md:text-sm">Nome</TableHead>
            <TableHead className="text-xs md:text-sm hidden sm:table-cell">Origem</TableHead>
            <TableHead className="w-[40px] md:w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
                Nenhuma categoria encontrada
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="py-2 md:py-4">
                  <div 
                    className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                </TableCell>
                <TableCell className="py-2 md:py-4">
                  <div className="font-medium text-xs md:text-sm">{cat.name}</div>
                  {cat.description && (
                    <div className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{cat.description}</div>
                  )}
                  {/* Badge de origem visível apenas em mobile */}
                  <div className="sm:hidden mt-1">
                    {cat.is_system ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Lock className="h-2.5 w-2.5" />
                        Sistema
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Personalizada</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell py-2 md:py-4">
                  {cat.is_system ? (
                    <Badge variant="secondary" className="gap-1 text-[10px] md:text-xs">
                      <Lock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      Sistema
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] md:text-xs">Personalizada</Badge>
                  )}
                </TableCell>
                <TableCell className="py-2 md:py-4">
                  {!cat.is_system && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                          <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(cat)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(cat.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Categorias Financeiras</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Gerencie categorias para organizar receitas e despesas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 md:mb-4 h-9 md:h-10">
              <TabsTrigger value="expense" className="gap-1 md:gap-2 text-xs md:text-sm">
                <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Despesas ({expenseCategories.length})
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-1 md:gap-2 text-xs md:text-sm">
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Receitas ({incomeCategories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense">
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleAdd('expense')} size="sm" className="w-full sm:w-auto h-8 md:h-9 text-xs md:text-sm">
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Nova Categoria de </span>Despesa
                  </Button>
                </div>
                {renderCategoryTable(expenseCategories, 'expense')}
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleAdd('income')} size="sm" className="w-full sm:w-auto h-8 md:h-9 text-xs md:text-sm">
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Nova Categoria de </span>Receita
                  </Button>
                </div>
                {renderCategoryTable(incomeCategories, 'income')}
              </div>
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

      {/* Dialog de confirmação de exclusão */}
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
