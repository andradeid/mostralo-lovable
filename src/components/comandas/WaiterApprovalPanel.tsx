import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ComandaItem } from '@/hooks/useComandas';

interface WaiterApprovalPanelProps {
  items: ComandaItem[];
  onApprovalChange: () => void;
}

export function WaiterApprovalPanel({ items, onApprovalChange }: WaiterApprovalPanelProps) {
  const { profile } = useAuth();
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  const pendingItems = items.filter(
    item => item.requires_approval && !item.approved_at
  );

  if (pendingItems.length === 0) {
    return null;
  }

  const handleApprove = async (itemId: string) => {
    setProcessingItems(prev => new Set(prev).add(itemId));
    
    try {
      const { error } = await supabase
        .from('comanda_items')
        .update({
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
          preparation_status: 'pending' // Vai para o KDS
        })
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item aprovado! Enviado para preparo.');
      onApprovalChange();
    } catch (error) {
      console.error('Erro ao aprovar item:', error);
      toast.error('Erro ao aprovar item');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleReject = async (itemId: string) => {
    setProcessingItems(prev => new Set(prev).add(itemId));
    
    try {
      // Ao rejeitar, simplesmente removemos o item
      const { error } = await supabase
        .from('comanda_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item recusado e removido da comanda.');
      onApprovalChange();
    } catch (error) {
      console.error('Erro ao recusar item:', error);
      toast.error('Erro ao recusar item');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleApproveAll = async () => {
    const itemIds = pendingItems.map(item => item.id);
    setProcessingItems(new Set(itemIds));

    try {
      const { error } = await supabase
        .from('comanda_items')
        .update({
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
          preparation_status: 'pending'
        })
        .in('id', itemIds);

      if (error) throw error;

      toast.success(`${pendingItems.length} itens aprovados!`);
      onApprovalChange();
    } catch (error) {
      console.error('Erro ao aprovar itens:', error);
      toast.error('Erro ao aprovar itens');
    } finally {
      setProcessingItems(new Set());
    }
  };

  return (
    <Card className="border-orange-500/50 bg-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Itens Aguardando Aprovação
            <Badge variant="destructive" className="ml-2">
              {pendingItems.length}
            </Badge>
          </CardTitle>
          {pendingItems.length > 1 && (
            <Button 
              size="sm" 
              onClick={handleApproveAll}
              disabled={processingItems.size > 0}
            >
              {processingItems.size > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Aprovar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {pendingItems.map((item) => {
              const isProcessing = processingItems.has(item.id);
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                    </p>
                    {item.notes && (
                      <p className="text-xs italic text-muted-foreground mt-1">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleReject(item.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Aprovar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
