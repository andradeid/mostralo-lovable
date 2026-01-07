import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToothRecords, TOOTH_CONDITIONS, ToothRecord } from "@/hooks/dental/useToothRecords";
import { ToothDetailDialog } from "./ToothDetailDialog";
import { cn } from "@/lib/utils";

interface OdontogramViewerProps {
  patientId: string;
  storeId: string;
}

// Notação FDI para dentes adultos
const ADULT_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

export function OdontogramViewer({ patientId, storeId }: OdontogramViewerProps) {
  const { recordsByTooth, isLoading, createRecord, updateRecord, deleteRecord } = useToothRecords(patientId, storeId);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getToothColor = (toothNumber: number): string => {
    const records = recordsByTooth[toothNumber];
    if (!records || records.length === 0) return "#22c55e"; // Saudável por padrão
    
    // Pega a condição mais recente
    const latestRecord = records[records.length - 1];
    const condition = TOOTH_CONDITIONS[latestRecord.condition as keyof typeof TOOTH_CONDITIONS];
    return condition?.color || "#22c55e";
  };

  const getToothConditions = (toothNumber: number): ToothRecord[] => {
    return recordsByTooth[toothNumber] || [];
  };

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
      <CardHeader>
        <CardTitle>Odontograma</CardTitle>
        <CardDescription>
          Clique em um dente para visualizar ou registrar condições
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legenda */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOOTH_CONDITIONS).map(([key, { label, color }]) => (
            <Badge
              key={key}
              variant="outline"
              className="gap-1.5"
              style={{ borderColor: color }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </Badge>
          ))}
        </div>

        {/* Arcada Superior */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground text-center">Arcada Superior</p>
          <div className="flex justify-center gap-1">
            {ADULT_TEETH.upper.map((toothNumber) => {
              const conditions = getToothConditions(toothNumber);
              const hasConditions = conditions.length > 0;
              const color = getToothColor(toothNumber);
              
              return (
                <button
                  key={toothNumber}
                  onClick={() => handleToothClick(toothNumber)}
                  className={cn(
                    "relative w-8 h-10 md:w-10 md:h-12 rounded-t-lg border-2 transition-all hover:scale-110 hover:z-10",
                    hasConditions ? "border-primary shadow-md" : "border-muted"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Dente ${toothNumber}`}
                >
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                    {toothNumber}
                  </span>
                  {hasConditions && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center">
                      {conditions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Linha central */}
        <div className="border-t border-dashed border-muted-foreground/30 my-8" />

        {/* Arcada Inferior */}
        <div className="space-y-2 mt-8">
          <div className="flex justify-center gap-1">
            {ADULT_TEETH.lower.map((toothNumber) => {
              const conditions = getToothConditions(toothNumber);
              const hasConditions = conditions.length > 0;
              const color = getToothColor(toothNumber);
              
              return (
                <button
                  key={toothNumber}
                  onClick={() => handleToothClick(toothNumber)}
                  className={cn(
                    "relative w-8 h-10 md:w-10 md:h-12 rounded-b-lg border-2 transition-all hover:scale-110 hover:z-10",
                    hasConditions ? "border-primary shadow-md" : "border-muted"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Dente ${toothNumber}`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                    {toothNumber}
                  </span>
                  {hasConditions && (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center">
                      {conditions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm font-medium text-muted-foreground text-center">Arcada Inferior</p>
        </div>

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
