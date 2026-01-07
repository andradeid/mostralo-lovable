import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToothRecords, TOOTH_CONDITIONS } from "@/hooks/dental/useToothRecords";
import { ToothDetailDialog } from "./ToothDetailDialog";
import { ToothSVG, OdontogramToolbar, GingivalLine } from "./odontogram";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OdontogramViewerProps {
  patientId: string;
  storeId: string;
}

// Notação FDI para dentes adultos
const ADULT_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

// Condições que afetam o dente inteiro (não por face)
const FULL_TOOTH_CONDITIONS = ["extraction", "missing", "implant", "crown", "prosthesis", "endodontic"];

export function OdontogramViewer({ patientId, storeId }: OdontogramViewerProps) {
  const { records, recordsByTooth, isLoading, createRecord, updateRecord, deleteRecord } = useToothRecords(patientId, storeId);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const { toast } = useToast();

  // Atalho ESC para cancelar ferramenta selecionada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTool) {
        setSelectedTool(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool]);

  // Obter condições por face para um dente específico
  const getFaceConditions = useCallback((toothNumber: number): Record<string, string> => {
    const toothRecords = recordsByTooth[toothNumber] || [];
    const faceConditions: Record<string, string> = {};
    
    toothRecords.forEach((record) => {
      if (record.face) {
        faceConditions[record.face] = record.condition;
      }
    });
    
    return faceConditions;
  }, [recordsByTooth]);

  // Obter condição de dente inteiro (se houver)
  const getFullToothCondition = useCallback((toothNumber: number): string | null => {
    const toothRecords = recordsByTooth[toothNumber] || [];
    
    for (const record of toothRecords) {
      if (!record.face && FULL_TOOTH_CONDITIONS.includes(record.condition)) {
        return record.condition;
      }
    }
    
    return null;
  }, [recordsByTooth]);

  // Handler para clique em uma face do dente
  const handleFaceClick = async (toothNumber: number, face: string) => {
    if (!selectedTool) return;

    const existingRecord = (recordsByTooth[toothNumber] || []).find(
      (r) => r.face === face
    );

    try {
      if (selectedTool === "eraser") {
        if (existingRecord) {
          await deleteRecord.mutateAsync(existingRecord.id);
          toast({
            title: "Condição removida",
            description: `Face ${face} do dente ${toothNumber} limpa.`,
          });
        }
      } else {
        if (existingRecord) {
          await updateRecord.mutateAsync({
            id: existingRecord.id,
            condition: selectedTool,
          });
        } else {
          await createRecord.mutateAsync({
            patient_id: patientId,
            store_id: storeId,
            tooth_number: toothNumber,
            face,
            condition: selectedTool,
          });
        }
        
        const conditionLabel = TOOTH_CONDITIONS[selectedTool as keyof typeof TOOTH_CONDITIONS]?.label || selectedTool;
        toast({
          title: "Condição registrada",
          description: `${conditionLabel} na face ${face} do dente ${toothNumber}.`,
        });
      }
    } catch (error) {
      console.error("Erro ao registrar condição:", error);
    }
  };

  // Handler para clique no dente (abre dialog de detalhes)
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Odontograma</CardTitle>
        <CardDescription className="text-xs">
          {selectedTool 
            ? `Clique nas faces dos dentes para aplicar: ${TOOTH_CONDITIONS[selectedTool as keyof typeof TOOTH_CONDITIONS]?.label || selectedTool}`
            : "Selecione uma ferramenta ou clique em um dente para ver detalhes"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Barra de ferramentas */}
        <OdontogramToolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />

        {/* Legenda compacta */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(TOOTH_CONDITIONS).slice(0, 6).map(([key, { label, color }]) => (
            <Badge
              key={key}
              variant="outline"
              className="gap-1 text-[9px] px-1.5 py-0"
              style={{ borderColor: color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </Badge>
          ))}
        </div>

        {/* Odontograma com vista frontal + oclusal */}
        <div className="space-y-2 overflow-x-auto pb-2">
          {/* ARCADA SUPERIOR */}
          <div className="space-y-0">
            <p className="text-[10px] font-semibold text-muted-foreground text-center uppercase tracking-wide mb-1">
              Arcada Superior
            </p>
            
            {/* Dentes superiores: Vista frontal (raízes cima) + número + oclusal */}
            <div className="flex justify-center gap-0 min-w-max mx-auto">
              {ADULT_TEETH.upper.map((toothNumber) => {
                const toothRecords = recordsByTooth[toothNumber] || [];
                
                return (
                  <ToothSVG
                    key={toothNumber}
                    toothNumber={toothNumber}
                    isUpper={true}
                    faceConditions={getFaceConditions(toothNumber)}
                    fullToothCondition={getFullToothCondition(toothNumber)}
                    selectedTool={selectedTool}
                    onFaceClick={(face) => handleFaceClick(toothNumber, face)}
                    onToothClick={() => handleToothClick(toothNumber)}
                    hasRecords={toothRecords.length > 0}
                    recordCount={toothRecords.length}
                  />
                );
              })}
            </div>

            {/* Linha gengival superior */}
            <div className="flex justify-center">
              <GingivalLine width={ADULT_TEETH.upper.length * 36} className="opacity-60" />
            </div>
          </div>

          {/* Linha central/média */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 border-t-2 border-dashed border-border" />
            <span className="text-[9px] font-medium text-muted-foreground px-2">LINHA MÉDIA</span>
            <div className="flex-1 border-t-2 border-dashed border-border" />
          </div>

          {/* ARCADA INFERIOR */}
          <div className="space-y-0">
            {/* Linha gengival inferior */}
            <div className="flex justify-center">
              <GingivalLine width={ADULT_TEETH.lower.length * 36} className="opacity-60 rotate-180" />
            </div>

            {/* Dentes inferiores: Oclusal + número + vista frontal (raízes baixo) */}
            <div className="flex justify-center gap-0 min-w-max mx-auto">
              {ADULT_TEETH.lower.map((toothNumber) => {
                const toothRecords = recordsByTooth[toothNumber] || [];
                
                return (
                  <ToothSVG
                    key={toothNumber}
                    toothNumber={toothNumber}
                    isUpper={false}
                    faceConditions={getFaceConditions(toothNumber)}
                    fullToothCondition={getFullToothCondition(toothNumber)}
                    selectedTool={selectedTool}
                    onFaceClick={(face) => handleFaceClick(toothNumber, face)}
                    onToothClick={() => handleToothClick(toothNumber)}
                    hasRecords={toothRecords.length > 0}
                    recordCount={toothRecords.length}
                  />
                );
              })}
            </div>
            
            <p className="text-[10px] font-semibold text-muted-foreground text-center uppercase tracking-wide mt-1">
              Arcada Inferior
            </p>
          </div>
        </div>

        {/* Instrução */}
        {selectedTool && (
          <p className="text-[10px] text-muted-foreground text-center">
            Pressione <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono border">ESC</kbd> para cancelar
          </p>
        )}

        {/* Dialog para detalhes do dente */}
        <ToothDetailDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          toothNumber={selectedTooth}
          patientId={patientId}
          storeId={storeId}
          records={selectedTooth ? recordsByTooth[selectedTooth] || [] : []}
          onCreateRecord={createRecord.mutateAsync}
          onUpdateRecord={updateRecord.mutateAsync}
          onDeleteRecord={deleteRecord.mutateAsync}
        />
      </CardContent>
    </Card>
  );
}
