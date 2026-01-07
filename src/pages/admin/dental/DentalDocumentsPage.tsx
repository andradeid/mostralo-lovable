import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useDentalDocumentTemplates, useDentalPatientDocuments } from "@/hooks/dental/useDentalDocuments";
import { usePatients } from "@/hooks/dental/usePatients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, FileText, User, Calendar, Download, Eye, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DocumentTemplateDialog from "@/components/admin/dental/DocumentTemplateDialog";

export default function DentalDocumentsPage() {
  const { storeId } = useStoreAccess();
  const { templates, isLoading: isLoadingTemplates, createTemplate, refetch: refetchTemplates } = useDentalDocumentTemplates(storeId);
  const { patients } = usePatients(storeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      consent: "Consentimento",
      prescription: "Receituário",
      certificate: "Atestado",
      referral: "Encaminhamento",
      anamnesis: "Anamnese",
      treatment_plan: "Plano de Tratamento",
      contract: "Contrato",
      other: "Outro",
    };
    return <Badge variant="secondary">{labels[type] || type}</Badge>;
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  if (isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gerencie documentos e modelos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="documents">Documentos Gerados</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "documents" ? "Buscar por paciente ou documento..." : "Buscar modelo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === "templates" && (
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="templates">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum modelo cadastrado</p>
                <Button variant="link" onClick={handleNewTemplate}>
                  Criar primeiro modelo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEditTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{template.name}</h3>
                        {getDocTypeBadge(template.type)}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {template.is_default && (
                          <Badge variant="outline" className="text-xs">Padrão</Badge>
                        )}
                        {!template.is_active && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione um paciente para ver os documentos gerados</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={selectedTemplate}
        storeId={storeId || ""}
      />
    </div>
  );
}
