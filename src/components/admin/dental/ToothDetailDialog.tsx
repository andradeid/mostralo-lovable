import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Clock } from "lucide-react";
import { TOOTH_CONDITIONS, TOOTH_FACES, ToothRecord, ToothRecordFormData } from "@/hooks/dental/useToothRecords";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ToothDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number | null;
  patientId: string;
  storeId: string;
  records: ToothRecord[];
  onCreateRecord: (data: ToothRecordFormData) => Promise<ToothRecord>;
  onUpdateRecord: (data: Partial<ToothRecord> & { id: string }) => Promise<ToothRecord>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export function ToothDetailDialog({
  open,
  onOpenChange,
  toothNumber,
  patientId,
  storeId,
  records,
  onCreateRecord,
  onDeleteRecord,
}: ToothDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"history" | "add">("history");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [condition, setCondition] = useState<string>("");
  const [face, setFace] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [material, setMaterial] = useState("");

  const resetForm = () => {
    setCondition("");
    setFace("");
    setNotes("");
    setMaterial("");
  };

  const handleSubmit = async () => {
    if (!toothNumber || !condition) return;

    setIsSubmitting(true);
    try {
      await onCreateRecord({
        patient_id: patientId,
        store_id: storeId,
        tooth_number: toothNumber,
        condition,
        face: face || undefined,
        notes: notes || undefined,
        material: material || undefined,
      });
      resetForm();
      setActiveTab("history");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      await onDeleteRecord(recordId);
    }
  };

  if (!toothNumber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Dente {toothNumber}
            {records.length > 0 && (
              <Badge variant="secondary">{records.length} registro(s)</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Visualize o histórico ou adicione novas condições
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "history" | "add")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            {records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum registro para este dente.</p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab("add")}
                  className="mt-2"
                >
                  Adicionar primeiro registro
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {records.map((record) => {
                    const conditionInfo = TOOTH_CONDITIONS[record.condition as keyof typeof TOOTH_CONDITIONS];
                    return (
                      <div
                        key={record.id}
                        className="p-3 rounded-lg border bg-muted/30 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: conditionInfo?.color || "#6b7280" }}
                            />
                            <span className="font-medium">
                              {conditionInfo?.label || record.condition}
                            </span>
                            {record.face && (
                              <Badge variant="outline" className="text-xs">
                                {TOOTH_FACES[record.face as keyof typeof TOOTH_FACES] || record.face}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {record.material && (
                          <p className="text-sm text-muted-foreground">
                            Material: {record.material}
                          </p>
                        )}
                        
                        {record.notes && (
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Condição *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOOTH_CONDITIONS).map(([key, { label, color }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Face (opcional)</Label>
              <Select value={face} onValueChange={setFace}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a face" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {Object.entries(TOOTH_FACES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {key} - {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Material (opcional)</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  <SelectItem value="resina">Resina Composta</SelectItem>
                  <SelectItem value="amalgama">Amálgama</SelectItem>
                  <SelectItem value="porcelana">Porcelana</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="zirconia">Zircônia</SelectItem>
                  <SelectItem value="ionomero">Ionômero de Vidro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o dente..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  setActiveTab("history");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!condition || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
