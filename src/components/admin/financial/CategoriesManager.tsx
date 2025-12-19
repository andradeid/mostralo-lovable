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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cor</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhuma categoria encontrada
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{cat.name}</div>
                  {cat.description && (
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  {cat.is_system ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Sistema
                    </Badge>
                  ) : (
                    <Badge variant="outline">Personalizada</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!cat.is_system && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
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
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Categorias Financeiras</CardTitle>
          <CardDescription>
            Gerencie as categorias para organizar suas receitas e despesas. 
            Categorias do sistema são globais e não podem ser editadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="expense" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Despesas ({expenseCategories.length})
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Receitas ({incomeCategories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleAdd('expense')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria de Despesa
                  </Button>
                </div>
                {renderCategoryTable(expenseCategories, 'expense')}
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleAdd('income')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria de Receita
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? 
              Não será possível excluir se houver transações vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
