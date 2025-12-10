import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Download, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface ExportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  labels: LabelOption[];
}

export function ExportContactsModal({ 
  open, 
  onOpenChange, 
  storeId,
  labels 
}: ExportContactsModalProps) {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'exportToCSV',
          store_id: storeId,
          source_filter: sourceFilter !== 'all' ? sourceFilter : undefined,
          label_ids: selectedLabels.length > 0 ? selectedLabels : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });

      if (response.error) throw response.error;

      const { data } = response.data;
      
      if (!data || data.length === 0) {
        toast.error('Nenhum contato encontrado com os filtros selecionados');
        return;
      }

      // Gerar CSV
      const headers = ['nome', 'telefone', 'push_name', 'origem', 'grupo_origem', 'etiquetas', 'whatsapp_valido', 'data_criacao'];
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) => 
          headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contatos-whatsapp-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${data.length} contatos exportados!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar contatos');
    } finally {
      setExporting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Exportar Contatos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtro por origem */}
          <div className="space-y-2">
            <Label>Origem</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="sync">Sincronizados</SelectItem>
                <SelectItem value="group_extract">Extraídos de Grupo</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="csv_import">Importação CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por etiquetas */}
          {labels.length > 0 && (
            <div className="space-y-2">
              <Label>Etiquetas (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedLabels.includes(label.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: label.color }} 
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
