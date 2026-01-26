import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface DeleteAllProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
  productsCount: number;
  categoriesCount: number;
  onSuccess: () => void;
}

export function DeleteAllProductsDialog({
  open,
  onOpenChange,
  storeId,
  storeName,
  productsCount,
  categoriesCount,
  onSuccess,
}: DeleteAllProductsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset fields when dialog closes
  useEffect(() => {
    if (!open) {
      setIsConfirmed(false);
      setStoreNameInput('');
      setPassword('');
    }
  }, [open]);

  const canSubmit = 
    isConfirmed && 
    storeNameInput.toLowerCase().trim() === storeName.toLowerCase().trim() &&
    password.length >= 6;

  const handleDelete = async () => {
    if (!canSubmit || !user?.email) return;

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão expirada');
      }

      const response = await supabase.functions.invoke('delete-all-products', {
        body: {
          storeId,
          confirmationName: storeNameInput,
          password,
          email: user.email,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao excluir produtos');
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir produtos');
      }

      toast({
        title: 'Exclusão concluída!',
        description: `${result.deleted.products} produtos e ${result.deleted.categories} categorias foram excluídos.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Todos os Produtos
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p className="font-semibold text-destructive">
              ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
            </p>
            
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm space-y-1">
              <p>Serão excluídos permanentemente:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li><strong>{productsCount}</strong> produtos</li>
                <li><strong>{categoriesCount}</strong> categorias</li>
                <li>Todas as variantes de produtos</li>
                <li>Todos os adicionais vinculados</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Checkbox de confirmação */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm cursor-pointer leading-tight">
              Confirmo que desejo excluir <strong>TODOS</strong> os produtos e categorias desta loja
            </Label>
          </div>

          {/* Input nome da loja */}
          <div className="space-y-2">
            <Label htmlFor="storeName">
              Digite o nome da loja para confirmar:
            </Label>
            <Input
              id="storeName"
              placeholder={storeName}
              value={storeNameInput}
              onChange={(e) => setStoreNameInput(e.target.value)}
              className={storeNameInput && storeNameInput.toLowerCase().trim() !== storeName.toLowerCase().trim() 
                ? 'border-destructive' 
                : ''
              }
            />
            {storeNameInput && storeNameInput.toLowerCase().trim() !== storeName.toLowerCase().trim() && (
              <p className="text-xs text-destructive">O nome não confere</p>
            )}
          </div>

          {/* Input senha */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Digite sua senha para autorizar:
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!canSubmit || isDeleting}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Tudo
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
