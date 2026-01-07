import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Printer, Download, Loader2 } from "lucide-react";
import { 
  useDentalDocumentTemplates, 
  useDentalPatientDocuments,
  DOCUMENT_TYPES,
  DEFAULT_TEMPLATES,
  DentalDocumentTemplate 
} from "@/hooks/dental/useDentalDocuments";
import { 
  replaceDocumentVariables, 
  AVAILABLE_VARIABLES,
  PatientData,
  ProfessionalData 
} from "@/utils/documentVariables";

interface GenerateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientData & { id: string };
  storeId: string;
  professional?: ProfessionalData;
  clinicName?: string;
}

export function GenerateDocumentDialog({
  open,
  onOpenChange,
  patient,
  storeId,
  professional,
  clinicName,
}: GenerateDocumentDialogProps) {
  const { templates, isLoading: templatesLoading } = useDentalDocumentTemplates(storeId);
  const { createDocument } = useDentalPatientDocuments(patient.id);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("prescription");
  const [documentTitle, setDocumentTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [customDays, setCustomDays] = useState("1");
  const [activeTab, setActiveTab] = useState("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId("");
      setSelectedType("prescription");
      setDocumentTitle("");
      setCustomContent("");
      setCustomDays("1");
      setActiveTab("edit");
    }
  }, [open]);

  // Set default title based on type
  useEffect(() => {
    if (selectedType && !documentTitle) {
      const typeLabel = DOCUMENT_TYPES[selectedType as keyof typeof DOCUMENT_TYPES]?.label || selectedType;
      setDocumentTitle(`${typeLabel} - ${patient.name}`);
    }
  }, [selectedType, patient.name, documentTitle]);

  // Get template content
  const templateContent = useMemo(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) return template.content;
    }
    // Use default template
    return DEFAULT_TEMPLATES[selectedType as keyof typeof DEFAULT_TEMPLATES] || "";
  }, [selectedTemplateId, selectedType, templates]);

  // Generate preview with replaced variables
  const previewContent = useMemo(() => {
    return replaceDocumentVariables(templateContent, {
      patient,
      professional,
      clinic: clinicName ? { name: clinicName } : undefined,
      customFields: {
        content: customContent,
        days: customDays,
      },
    });
  }, [templateContent, patient, professional, clinicName, customContent, customDays]);

  // Filter templates by type
  const filteredTemplates = templates.filter(t => t.type === selectedType);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${previewContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      
      await createDocument.mutateAsync({
        patient_id: patient.id,
        store_id: storeId,
        template_id: selectedTemplateId || null,
        type: selectedType,
        title: documentTitle,
        content: previewContent,
        generated_by: user?.id || null,
        professional_name: professional?.name || null,
        professional_registration: professional?.registration || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Documento
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento e preencha as informações necessárias.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 mt-4">
            <div className="grid gap-4">
              {/* Document Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Modelo (opcional)</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Usar modelo padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Modelo padrão</SelectItem>
                      {filteredTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Document Title */}
              <div className="space-y-2">
                <Label>Título do Documento</Label>
                <Input 
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Ex: Receituário - João da Silva"
                />
              </div>

              {/* Custom Content */}
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea 
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder={
                    selectedType === "prescription" 
                      ? "Digite a prescrição (medicamentos, dosagens, etc.)"
                      : selectedType === "certificate"
                      ? "Observações adicionais do atestado"
                      : "Conteúdo do documento"
                  }
                  rows={6}
                />
              </div>

              {/* Days field for certificate */}
              {selectedType === "certificate" && (
                <div className="space-y-2">
                  <Label>Dias de Afastamento</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}

              {/* Available Variables */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Variáveis Disponíveis</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(AVAILABLE_VARIABLES).slice(0, 8).map(([variable, description]) => (
                    <Badge 
                      key={variable} 
                      variant="outline" 
                      className="text-xs cursor-help"
                      title={description}
                    >
                      {variable}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    +{Object.keys(AVAILABLE_VARIABLES).length - 8} mais
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 mt-4">
            <ScrollArea className="h-[400px] border rounded-lg p-4 bg-white">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !documentTitle} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Salvar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
