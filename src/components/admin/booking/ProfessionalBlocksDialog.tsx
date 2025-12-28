import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalBlocksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  onSuccess?: () => void;
}

interface Block {
  id?: string;
  professional_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
}

export function ProfessionalBlocksDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  onSuccess
}: ProfessionalBlocksDialogProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New block form
  const [newBlock, setNewBlock] = useState<Omit<Block, 'id' | 'professional_id'>>({
    block_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '18:00',
    all_day: true,
    reason: ''
  });

  // Fetch existing blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!open || !professionalId) return;
      
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('professional_blocks')
          .select('*')
          .eq('professional_id', professionalId)
          .gte('block_date', format(new Date(), 'yyyy-MM-dd'))
          .order('block_date', { ascending: true });

        if (error) throw error;
        setBlocks((data || []) as Block[]);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        toast.error('Erro ao carregar bloqueios');
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [open, professionalId]);

  const handleAddBlock = async () => {
    if (!newBlock.block_date) {
      toast.error('Selecione uma data');
      return;
    }

    setSaving(true);
    try {
      const blockData = {
        professional_id: professionalId,
        block_date: newBlock.block_date,
        start_time: newBlock.all_day ? null : newBlock.start_time,
        end_time: newBlock.all_day ? null : newBlock.end_time,
        all_day: newBlock.all_day,
        reason: newBlock.reason || null
      };

      const { data, error } = await (supabase as any)
        .from('professional_blocks')
        .insert(blockData)
        .select()
        .single();

      if (error) throw error;

      setBlocks(prev => [...prev, data as Block].sort((a, b) =>
        a.block_date.localeCompare(b.block_date)
      ));

      // Reset form
      setNewBlock({
        block_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '18:00',
        all_day: true,
        reason: ''
      });

      toast.success('Bloqueio adicionado!');
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Erro ao adicionar bloqueio');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('professional_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlocks(prev => prev.filter(b => b.id !== blockId));
      toast.success('Bloqueio removido!');
    } catch (error) {
      console.error('Error removing block:', error);
      toast.error('Erro ao remover bloqueio');
    }
  };

  const formatBlockDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Bloqueios de {professionalName}
          </DialogTitle>
          <DialogDescription>
            Adicione folgas, férias ou horários indisponíveis
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* New Block Form */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="font-medium text-sm">Adicionar Bloqueio</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newBlock.block_date}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, block_date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                
                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={newBlock.all_day}
                    onCheckedChange={(checked) => setNewBlock(prev => ({ ...prev, all_day: checked }))}
                  />
                  <Label>Dia inteiro</Label>
                </div>

                {!newBlock.all_day && (
                  <>
                    <div>
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={newBlock.start_time || ''}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={newBlock.end_time || ''}
                        onChange={(e) => setNewBlock(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Label>Motivo (opcional)</Label>
                  <Textarea
                    value={newBlock.reason || ''}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Ex: Férias, Consulta médica, Folga..."
                    rows={2}
                  />
                </div>
              </div>

              <Button onClick={handleAddBlock} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bloqueio
              </Button>
            </div>

            {/* Existing Blocks */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Bloqueios Futuros</h4>
              
              {blocks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum bloqueio futuro cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <div 
                      key={block.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {formatBlockDate(block.block_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {block.all_day 
                            ? 'Dia inteiro' 
                            : `${block.start_time?.slice(0, 5)} - ${block.end_time?.slice(0, 5)}`
                          }
                          {block.reason && ` • ${block.reason}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => block.id && handleRemoveBlock(block.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
