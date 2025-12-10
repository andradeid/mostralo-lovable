import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Group {
  id: string;
  group_jid: string;
  name: string | null;
  participants_count: number;
}

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface ExtractGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  storeId: string;
  instance: {
    instance_name: string;
  };
  onSuccess: () => void;
}

export function ExtractGroupModal({ 
  open, 
  onOpenChange, 
  group,
  storeId,
  instance,
  onSuccess 
}: ExtractGroupModalProps) {
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLabels();
    }
  }, [open, storeId]);

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels')
      .select('id, name, color')
      .eq('store_id', storeId)
      .order('name');
    
    setLabels(data || []);
  };

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'extractFromGroup',
          store_id: storeId,
          instance_name: instance.instance_name,
          group_jid: group.group_jid,
          group_name: group.name,
          label_id: selectedLabel && selectedLabel !== 'none' ? selectedLabel : undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success(`${response.data.extracted} contatos extraídos do grupo!`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao extrair:', error);
      toast.error('Erro ao extrair contatos do grupo');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Extrair Contatos do Grupo
          </DialogTitle>
          <DialogDescription>
            Salve os participantes do grupo como contatos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{group.name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">
                {group.participants_count} participantes
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Contatos já existentes serão atualizados, não duplicados.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Atribuir Etiqueta (opcional)</Label>
            <Select value={selectedLabel} onValueChange={setSelectedLabel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {labels.map(label => (
                  <SelectItem key={label.id} value={label.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Todos os contatos extraídos receberão esta etiqueta
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExtract} disabled={extracting}>
            <Download className="h-4 w-4 mr-2" />
            {extracting ? 'Extraindo...' : 'Extrair Contatos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
