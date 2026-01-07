import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Pill,
  FileCheck,
  FileSignature,
  Forward,
  Eye,
  Printer,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDentalPatientDocuments, DOCUMENT_TYPES, DentalPatientDocument } from "@/hooks/dental/useDentalDocuments";

interface PatientDocumentsListProps {
  patientId: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  prescription: Pill,
  certificate: FileCheck,
  consent: FileSignature,
  referral: Forward,
  declaration: FileText,
};

export function PatientDocumentsList({ patientId }: PatientDocumentsListProps) {
  const { documents, isLoading, deleteDocument } = useDentalPatientDocuments(patientId);
  const [viewDocument, setViewDocument] = useState<DentalPatientDocument | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePrint = (document: DentalPatientDocument) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${document.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${document.content}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDelete = async () => {
    if (!deleteDocumentId) return;
    setIsDeleting(true);
    try {
      await deleteDocument.mutateAsync(deleteDocumentId);
    } finally {
      setIsDeleting(false);
      setDeleteDocumentId(null);
    }
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum documento</h3>
        <p className="text-muted-foreground">
          Os documentos gerados para este paciente aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => {
          const Icon = TYPE_ICONS[doc.type] || FileText;
          const typeInfo = DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES];

          return (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {typeInfo?.label || doc.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gerado em {formatDate(doc.created_at)}
                      </p>
                      {doc.professional_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Por: {doc.professional_name}
                          {doc.professional_registration && ` (CRO: ${doc.professional_registration})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setViewDocument(doc)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handlePrint(doc)}
                      title="Imprimir"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteDocumentId(doc.id)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Document Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewDocument?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] border rounded-lg p-4 bg-white">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: viewDocument?.content || "" }}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewDocument(null)}>
              Fechar
            </Button>
            {viewDocument && (
              <Button onClick={() => handlePrint(viewDocument)} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocumentId} onOpenChange={() => setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
