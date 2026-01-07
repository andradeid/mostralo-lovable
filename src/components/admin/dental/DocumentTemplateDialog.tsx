import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDentalDocumentTemplates } from "@/hooks/dental/useDentalDocuments";

interface DocumentTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  storeId: string;
}

const DOCUMENT_TYPES = [
  { value: "consent", label: "Consentimento" },
  { value: "prescription", label: "Receituário" },
  { value: "certificate", label: "Atestado" },
  { value: "referral", label: "Encaminhamento" },
  { value: "anamnesis", label: "Anamnese" },
  { value: "treatment_plan", label: "Plano de Tratamento" },
  { value: "contract", label: "Contrato" },
  { value: "other", label: "Outro" },
];

export default function DocumentTemplateDialog({
  open,
  onOpenChange,
  template,
  storeId,
}: DocumentTemplateDialogProps) {
  const { createTemplate } = useDentalDocumentTemplates(storeId);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "other",
    description: "",
    content: "",
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        type: template.type || "other",
        description: template.description || "",
        content: template.content || "",
        is_active: template.is_active ?? true,
        is_default: template.is_default ?? false,
      });
    } else {
      setFormData({
        name: "",
        type: "other",
        description: "",
        content: "",
        is_active: true,
        is_default: false,
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const data = {
        store_id: storeId,
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        content: formData.content,
        is_active: formData.is_active,
        is_default: formData.is_default,
      };

      await createTemplate.mutateAsync(data);
      
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Modelo" : "Novo Modelo de Documento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do modelo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição breve do modelo"
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo do Documento *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Conteúdo do documento. Use variáveis como {{paciente_nome}}, {{data}}, etc."
              rows={12}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {"{{paciente_nome}}"}, {"{{paciente_cpf}}"}, {"{{data}}"}, {"{{profissional_nome}}"}, {"{{clinica_nome}}"}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
              />
              <Label htmlFor="is_default">Modelo padrão</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.content}>
              {loading ? "Salvando..." : template ? "Atualizar" : "Criar Modelo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
