// Cabeçalho da tela de produtos: título, menu Importar e botões Nova Categoria / Novo Produto.
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Grid, Upload, ChevronDown, FileSpreadsheet, ImagePlus } from 'lucide-react';

interface Props {
  userRole: string | null | undefined;
  totalProducts: number;
  onOpenImageSync: () => void;
  onOpenDeleteAll: () => void;
  onOpenCategoryForm: () => void;
}

export function ProductsPageHeader({ userRole, totalProducts, onOpenImageSync, onOpenDeleteAll, onOpenCategoryForm }: Props) {
  const navigate = useNavigate();

  return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos da sua loja</p>
        </div>
          <div className="flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">Importar</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard/products/import')}>
                <Upload className="w-4 h-4 mr-2" />
                Importação Padrão (CSV/Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/products/import-alquimia')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar do Alquimia
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenImageSync()}>
                <ImagePlus className="w-4 h-4 mr-2" />
                Sincronizar Imagens
              </DropdownMenuItem>
              {(userRole === 'store_admin' || userRole === 'master_admin') && totalProducts > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onOpenDeleteAll()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Tudo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onOpenCategoryForm()}
          >
            <Grid className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nova Categoria</span>
            <span className="sm:hidden">Categoria</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => navigate('/dashboard/products/new')}
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Produto</span>
          </Button>
        </div>
      </div>
  );
}
