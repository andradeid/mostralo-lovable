import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarX, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { useProfessionalData, useProfessionalBlocks } from "@/hooks/useProfessionalData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessionalBlocks() {
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalData();
  const { data: blocks, isLoading } = useProfessionalBlocks(professional?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    block_date: "",
    is_all_day: true,
    start_time: "09:00",
    end_time: "18:00",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional?.id || !formData.block_date) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("professional_blocks")
        .insert({
          professional_id: professional.id,
          block_date: formData.block_date,
          is_all_day: formData.is_all_day,
          start_time: formData.is_all_day ? null : formData.start_time,
          end_time: formData.is_all_day ? null : formData.end_time,
          reason: formData.reason || null,
        });

      if (error) throw error;

      toast.success("Bloqueio criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["professional-blocks"] });
      setDialogOpen(false);
      setFormData({
        block_date: "",
        is_all_day: true,
        start_time: "09:00",
        end_time: "18:00",
        reason: "",
      });
    } catch (error) {
      console.error("Erro ao criar bloqueio:", error);
      toast.error("Erro ao criar bloqueio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from("professional_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      toast.success("Bloqueio removido");
      queryClient.invalidateQueries({ queryKey: ["professional-blocks"] });
    } catch (error) {
      console.error("Erro ao remover bloqueio:", error);
      toast.error("Erro ao remover bloqueio");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Bloqueios</h1>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Bloqueio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Bloqueio</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="block_date">Data</Label>
                <Input
                  id="block_date"
                  type="date"
                  value={formData.block_date}
                  onChange={(e) => setFormData({ ...formData, block_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_all_day">Dia inteiro</Label>
                <Switch
                  id="is_all_day"
                  checked={formData.is_all_day}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
                />
              </div>

              {!formData.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Início</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Fim</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ex: Consulta médica, férias, etc."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Bloqueio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="w-5 h-5" />
            Bloqueios Agendados
          </CardTitle>
          <CardDescription>
            Dias ou horários em que você não estará disponível para atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blocks && blocks.length > 0 ? (
            <div className="space-y-3">
              {blocks.map((block: any) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <Calendar className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(parseISO(block.block_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {block.is_all_day 
                          ? "Dia inteiro" 
                          : `${block.start_time?.slice(0, 5)} - ${block.end_time?.slice(0, 5)}`
                        }
                      </p>
                      {block.reason && (
                        <p className="text-sm text-muted-foreground italic">
                          {block.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(block.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarX className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum bloqueio agendado</p>
              <p className="text-sm">Crie bloqueios para dias que você não poderá atender</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
