import { cn } from "@/lib/utils";
import { ToothFaceDiagram } from "./ToothFaceDiagram";
import { ToothFrontalView } from "./ToothFrontalView";
import { X } from "lucide-react";

interface ToothSVGProps {
  toothNumber: number;
  isUpper: boolean;
  faceConditions: Record<string, string>;
  fullToothCondition?: string | null;
  selectedTool: string | null;
  onFaceClick: (face: string) => void;
  onToothClick: () => void;
  hasRecords: boolean;
  recordCount: number;
}

// Cores das condições
const CONDITION_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  caries: "#ef4444",
  restoration: "#3b82f6",
  extraction: "#6b7280",
  missing: "#d1d5db",
  implant: "#8b5cf6",
  crown: "#f59e0b",
  endodontic: "#ec4899",
  prosthesis: "#14b8a6",
  fracture: "#f97316",
  periapical: "#dc2626",
  mobility: "#eab308",
};

export function ToothSVG({
  toothNumber,
  isUpper,
  faceConditions,
  fullToothCondition,
  selectedTool,
  onFaceClick,
  onToothClick,
  hasRecords,
  recordCount,
}: ToothSVGProps) {
  const isMissing = fullToothCondition === "missing";
  const isExtraction = fullToothCondition === "extraction";

  // Obter condição vestibular para colorir a vista frontal
  const vestibularCondition = faceConditions["V"];

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center gap-0.5 px-0.5 py-1 rounded-lg transition-all",
        "hover:bg-muted/50",
        selectedTool && "cursor-crosshair",
        hasRecords && "ring-1 ring-primary/30"
      )}
    >
      {/* Layout para arcada SUPERIOR: Frontal (raízes para cima) -> Número -> Oclusal */}
      {isUpper && (
        <>
          {/* Vista frontal anatômica */}
          <div 
            className="relative"
            onClick={!selectedTool ? onToothClick : undefined}
          >
            <ToothFrontalView
              toothNumber={toothNumber}
              fullToothCondition={fullToothCondition || undefined}
              vestibularCondition={vestibularCondition}
              onClick={() => {
                if (selectedTool && selectedTool !== "eraser") {
                  onFaceClick("V");
                }
              }}
              size={0.7}
            />
            
            {/* Overlay de extração */}
            {isExtraction && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <X className="h-6 w-6 text-red-500 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Número do dente */}
          <span className="text-[10px] font-bold text-foreground bg-muted/80 px-1 rounded">
            {toothNumber}
          </span>

          {/* Vista oclusal (diagrama de faces) */}
          <div className="relative">
            <ToothFaceDiagram
              toothNumber={toothNumber}
              faceConditions={faceConditions}
              selectedTool={selectedTool}
              onFaceClick={onFaceClick}
              size={32}
            />
          </div>
        </>
      )}

      {/* Layout para arcada INFERIOR: Oclusal -> Número -> Frontal (raízes para baixo) */}
      {!isUpper && (
        <>
          {/* Vista oclusal (diagrama de faces) */}
          <div className="relative">
            <ToothFaceDiagram
              toothNumber={toothNumber}
              faceConditions={faceConditions}
              selectedTool={selectedTool}
              onFaceClick={onFaceClick}
              size={32}
            />
          </div>

          {/* Número do dente */}
          <span className="text-[10px] font-bold text-foreground bg-muted/80 px-1 rounded">
            {toothNumber}
          </span>

          {/* Vista frontal anatômica */}
          <div 
            className="relative"
            onClick={!selectedTool ? onToothClick : undefined}
          >
            <ToothFrontalView
              toothNumber={toothNumber}
              fullToothCondition={fullToothCondition || undefined}
              vestibularCondition={vestibularCondition}
              onClick={() => {
                if (selectedTool && selectedTool !== "eraser") {
                  onFaceClick("V");
                }
              }}
              size={0.7}
            />
            
            {/* Overlay de extração */}
            {isExtraction && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <X className="h-6 w-6 text-red-500 stroke-[3]" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Badge de quantidade de registros */}
      {recordCount > 0 && (
        <span className={cn(
          "absolute right-0 h-4 min-w-4 px-0.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center",
          isUpper ? "top-0" : "bottom-0"
        )}>
          {recordCount}
        </span>
      )}
    </div>
  );
}
