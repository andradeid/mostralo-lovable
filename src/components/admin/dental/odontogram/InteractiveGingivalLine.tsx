import { useState } from "react";
import { cn } from "@/lib/utils";
import { PeriodontalInputPopover } from "./PeriodontalInputPopover";
import {
  PeriodontalRecord,
  getPeriodontalClassification,
} from "@/hooks/dental/usePeriodontalRecords";

interface InteractiveGingivalLineProps {
  teeth: number[];
  isUpper: boolean;
  isInteractive: boolean;
  periodontalRecords: Record<string, PeriodontalRecord>;
  onSaveRecord: (
    toothNumber: number,
    position: string,
    data: { pocketDepth: number; recession: number; bleeding: boolean }
  ) => void;
  onDeleteRecord?: (recordId: string) => void;
  className?: string;
}

// Posições por dente para sondagem periodontal
const POSITIONS_PER_TOOTH = ["MV", "V", "DV"]; // Mésio-Vest, Vestibular, Disto-Vest

export function InteractiveGingivalLine({
  teeth,
  isUpper,
  isInteractive,
  periodontalRecords,
  onSaveRecord,
  onDeleteRecord,
  className,
}: InteractiveGingivalLineProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const toothWidth = 36; // Largura de cada dente
  const totalWidth = teeth.length * toothWidth;
  const pointSpacing = toothWidth / 3; // 3 pontos por dente

  // Gerar pontos para cada dente (3 pontos por dente: MV, V, DV)
  const points: Array<{
    toothNumber: number;
    position: string;
    x: number;
    record: PeriodontalRecord | null;
  }> = [];

  teeth.forEach((toothNumber, toothIndex) => {
    POSITIONS_PER_TOOTH.forEach((position, posIndex) => {
      const x = toothIndex * toothWidth + pointSpacing * posIndex + pointSpacing / 2;
      const recordKey = `${toothNumber}-${position}`;
      const record = periodontalRecords[recordKey] || null;
      points.push({ toothNumber, position, x, record });
    });
  });

  if (!isInteractive) {
    // Modo decorativo - apenas linha ondulada estática
    return (
      <svg
        width={totalWidth}
        height="12"
        viewBox={`0 0 ${totalWidth} 12`}
        className={cn("transition-opacity", className)}
        preserveAspectRatio="none"
      >
        <path
          d={generateDecorativePath(totalWidth)}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="2"
          opacity="0.4"
        />
        <path
          d={`${generateDecorativePath(totalWidth)} L${totalWidth},12 L0,12 Z`}
          fill="hsl(var(--destructive))"
          opacity="0.1"
        />
      </svg>
    );
  }

  // Modo interativo - pontos clicáveis
  return (
    <div className={cn("relative", className)} style={{ width: totalWidth, height: 24 }}>
      {/* Linha de base */}
      <svg
        width={totalWidth}
        height="24"
        viewBox={`0 0 ${totalWidth} 24`}
        className="absolute inset-0"
      >
        {/* Linha conectando os pontos */}
        <path
          d={generateInteractivePath(points, isUpper)}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>

      {/* Pontos interativos */}
      {points.map(({ toothNumber, position, x, record }) => {
        const key = `${toothNumber}-${position}`;
        const classification = record
          ? getPeriodontalClassification(record.pocket_depth)
          : null;
        
        // Calcular posição Y baseada na retração gengival
        const baseY = 12;
        const recessionOffset = record ? Math.min(record.gingival_recession * 0.8, 8) : 0;
        const y = isUpper ? baseY + recessionOffset : baseY - recessionOffset;

        return (
          <PeriodontalInputPopover
            key={key}
            open={activePopover === key}
            onOpenChange={(open) => setActivePopover(open ? key : null)}
            toothNumber={toothNumber}
            position={position}
            currentPocketDepth={record?.pocket_depth}
            currentRecession={record?.gingival_recession}
            currentBleeding={record?.bleeding}
            onSave={(data) => onSaveRecord(toothNumber, position, data)}
            onDelete={
              record && onDeleteRecord
                ? () => onDeleteRecord(record.id)
                : undefined
            }
          >
            <button
              className={cn(
                "absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2",
                "transition-all duration-150 hover:scale-150",
                "border-2 focus:outline-none focus:ring-2 focus:ring-offset-1",
                record ? "border-white shadow-md" : "border-muted-foreground/30 bg-background"
              )}
              style={{
                left: x,
                top: y,
                backgroundColor: classification?.color || "transparent",
                boxShadow: record?.bleeding
                  ? `0 0 0 2px hsl(var(--destructive))`
                  : undefined,
              }}
              title={`Dente ${toothNumber} - ${position}${
                record
                  ? ` (${record.pocket_depth}mm${record.bleeding ? ", sangramento" : ""})`
                  : ""
              }`}
            />
          </PeriodontalInputPopover>
        );
      })}
    </div>
  );
}

// Gerar caminho decorativo ondulado
function generateDecorativePath(width: number): string {
  const segments = Math.ceil(width / 20);
  let path = "M0,6";

  for (let i = 0; i < segments; i++) {
    const x1 = i * 20 + 5;
    const x2 = i * 20 + 15;
    const x3 = (i + 1) * 20;
    path += ` Q${x1},3 ${Math.min(x2, width)},6`;
    if (x3 <= width) {
      path += ` Q${x3 - 5},9 ${x3},6`;
    }
  }

  return path;
}

// Gerar caminho interativo baseado nos pontos
function generateInteractivePath(
  points: Array<{ x: number; record: PeriodontalRecord | null }>,
  isUpper: boolean
): string {
  if (points.length === 0) return "";

  const baseY = 12;
  
  return points
    .map((point, index) => {
      const recessionOffset = point.record
        ? Math.min(point.record.gingival_recession * 0.8, 8)
        : 0;
      const y = isUpper ? baseY + recessionOffset : baseY - recessionOffset;
      
      return index === 0 ? `M${point.x},${y}` : `L${point.x},${y}`;
    })
    .join(" ");
}
