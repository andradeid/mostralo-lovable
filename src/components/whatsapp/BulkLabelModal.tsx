import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface BulkLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  selectedCount: number;
  onAssign: (labelId: string) => void;
}

export function BulkLabelModal({ 
  open, 
  onOpenChange, 
  storeId, 
  selectedCount,
  onAssign 
}: BulkLabelModalProps) {
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  const handleAssign = () => {
    if (!selectedLabel) return;
    setLoading(true);
    onAssign(selectedLabel);
    setLoading(false);
    setSelectedLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Etiqueta</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Selecione a etiqueta para adicionar a {selectedCount} contato(s):
          </p>

          {labels.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma etiqueta criada. Crie uma etiqueta primeiro.
            </p>
          ) : (
            <RadioGroup value={selectedLabel} onValueChange={setSelectedLabel}>
              <div className="space-y-2">
                {labels.map(label => (
                  <div 
                    key={label.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLabel(label.id)}
                  >
                    <RadioGroupItem value={label.id} id={label.id} />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: label.color }} 
                    />
                    <Label htmlFor={label.id} className="cursor-pointer flex-1">
                      {label.name}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedLabel || loading || labels.length === 0}
          >
            {loading ? 'Aplicando...' : 'Aplicar Etiqueta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
