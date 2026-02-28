import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Copy, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreOption {
  id: string;
  name: string;
  slug: string;
}

interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

interface CloneStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreOption[];
  onSuccess: () => void;
}

type CloneStatus = 'idle' | 'cloning' | 'success' | 'error';

export function CloneStoreDialog({ open, onOpenChange, stores, onSuccess }: CloneStoreDialogProps) {
  const [sourceStoreId, setSourceStoreId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [status, setStatus] = useState<CloneStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [resultStats, setResultStats] = useState<Record<string, number> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Gerar slug automaticamente a partir do nome
  useEffect(() => {
    if (newName) {
      const slug = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setNewSlug(slug);
    }
  }, [newName]);

  // Buscar owners (store_admins)
  useEffect(() => {
    if (open) {
      fetchOwners();
    }
  }, [open]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'store_admin');

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        setOwners(
          (profiles || []).map(p => ({
            id: p.id,
            name: p.full_name || 'Sem nome',
            email: p.email || '',
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao buscar owners:', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleClone = async () => {
    if (!sourceStoreId || !newName || !newSlug || !ownerId) {
      toast.error('Preencha todos os campos');
      return;
    }

    setStatus('cloning');
    setProgress(0);
    setErrorMessage('');

    // Progresso simulado
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke('clone-store', {
        body: {
          source_store_id: sourceStoreId,
          new_name: newName,
          new_slug: newSlug,
          owner_id: ownerId,
        },
      });

      clearInterval(interval);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      setStatus('success');
      setResultStats(data.stats);
      toast.success(data.message || 'Loja clonada com sucesso!');
      onSuccess();
    } catch (err: unknown) {
      clearInterval(interval);
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setErrorMessage(message);
      toast.error(`Erro na clonagem: ${message}`);
    }
  };

  const handleClose = () => {
    if (status === 'cloning') return; // Não fechar durante clonagem
    setStatus('idle');
    setProgress(0);
    setSourceStoreId('');
    setNewName('');
    setNewSlug('');
    setOwnerId('');
    setResultStats(null);
    setErrorMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clonar Loja
          </DialogTitle>
          <DialogDescription>
            Cria uma cópia completa da loja com produtos, categorias e configurações.
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4 py-2">
            {/* Loja origem */}
            <div className="space-y-2">
              <Label htmlFor="source">Loja Origem</Label>
              <Select value={sourceStoreId} onValueChange={setSourceStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja para clonar" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome da nova loja */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Nova Loja</Label>
              <Input
                id="name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Farmabella Filial 2"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value)}
                placeholder="farmabella-filial-2"
              />
              <p className="text-xs text-muted-foreground">
                URL: /loja/{newSlug || '...'}
              </p>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label htmlFor="owner">Proprietário (Store Admin)</Label>
              {loadingOwners ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {status === 'cloning' && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Clonando loja...</p>
              <p className="text-sm text-muted-foreground">
                Copiando produtos, categorias e configurações. Isso pode levar até 30 segundos.
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        )}

        {status === 'success' && resultStats && (
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <p className="font-medium text-lg">Loja clonada com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1">
                A nova loja "{newName}" está pronta.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold">{resultStats.categories}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold">{resultStats.products}</p>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold">{resultStats.variants}</p>
                <p className="text-xs text-muted-foreground">Variantes</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Configure WhatsApp e OpenAI na nova loja para ativar o bot.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium text-lg">Erro na clonagem</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleClone}
                disabled={!sourceStoreId || !newName || !newSlug || !ownerId}
              >
                <Copy className="h-4 w-4 mr-2" />
                Clonar Loja
              </Button>
            </>
          )}
          {(status === 'success' || status === 'error') && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
