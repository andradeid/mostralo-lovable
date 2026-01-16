import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, Ban, UserX, Database } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type DeleteMode = 'full' | 'deactivate' | 'user_only';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  store_name?: string;
}

interface AdvancedDeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSuccess: () => void;
}

const DELETE_OPTIONS = [
  {
    value: 'deactivate' as DeleteMode,
    label: 'Desativar Usuário',
    description: 'Bloqueia acesso mas mantém todos os dados intactos. Pode ser revertido.',
    icon: Ban,
    color: 'text-yellow-600 dark:text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  },
  {
    value: 'user_only' as DeleteMode,
    label: 'Excluir Só Usuário',
    description: 'Remove conta e perfil. Loja fica órfã (sem dono) mas dados preservados.',
    icon: UserX,
    color: 'text-blue-600 dark:text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
  {
    value: 'full' as DeleteMode,
    label: 'Excluir Tudo',
    description: 'Remove TUDO: usuário, loja, produtos, pedidos, clientes, agendamentos... IRREVERSÍVEL!',
    icon: Database,
    color: 'text-red-600 dark:text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  },
];

export function AdvancedDeleteUserModal({ open, onOpenChange, user, onSuccess }: AdvancedDeleteUserModalProps) {
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('deactivate');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);

  const requiresConfirmation = deleteMode === 'full' || deleteMode === 'user_only';
  const confirmationValid = !requiresConfirmation || confirmText === 'EXCLUIR';

  const handleSubmit = async () => {
    if (!user || !confirmationValid) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user-complete', {
        body: { userId: user.id, deleteMode, reason }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.deletedItems);
      
      const modeLabels = {
        full: 'Usuário e dados excluídos',
        deactivate: 'Usuário desativado',
        user_only: 'Usuário excluído (loja mantida)'
      };
      
      toast.success(modeLabels[deleteMode] + ' com sucesso');
      
      // Wait a moment to show results, then close
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro na exclusão:', error);
      toast.error('Erro: ' + (error.message || 'Falha na operação'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
    setDeleteMode('deactivate');
    setReason('');
    setConfirmText('');
    setResult(null);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Exclusão Avançada
          </DialogTitle>
          <DialogDescription>
            <strong>{user.full_name}</strong> ({user.email})
            {user.store_name && (
              <span className="block text-xs mt-1">
                Loja: <strong>{user.store_name}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <AlertDescription>
                <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                  ✓ Operação concluída com sucesso
                </p>
                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  {Object.entries(result).map(([key, count]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key.replace(/_/g, ' ')}:</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Delete Mode Selection */}
            <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as DeleteMode)}>
              <div className="space-y-3">
                {DELETE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = deleteMode === option.value;
                  
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected ? option.bgColor : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <RadioGroupItem value={option.value} className="mt-0.5" />
                      <div className="flex-1">
                        <div className={cn('font-medium flex items-center gap-2', isSelected && option.color)}>
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>

            {/* Warning for destructive options */}
            {deleteMode === 'full' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ATENÇÃO:</strong> Esta ação é IRREVERSÍVEL! Todos os dados serão 
                  permanentemente excluídos incluindo produtos, pedidos, clientes e histórico.
                </AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Digite o motivo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Confirmation for destructive actions */}
            {requiresConfirmation && (
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-destructive">
                  Digite <strong>EXCLUIR</strong> para confirmar
                </Label>
                <Input
                  id="confirm"
                  placeholder="EXCLUIR"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  disabled={loading}
                  className={cn(
                    confirmText && confirmText !== 'EXCLUIR' && 'border-destructive'
                  )}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {result ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {!result && (
            <Button
              variant={deleteMode === 'deactivate' ? 'default' : 'destructive'}
              onClick={handleSubmit}
              disabled={loading || !confirmationValid}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleteMode === 'deactivate' ? 'Desativar' : 'Excluir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
