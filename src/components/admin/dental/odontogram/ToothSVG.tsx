import { cn } from "@/lib/utils";
import { ToothFaceDiagram } from "./ToothFaceDiagram";
import { X, Circle } from "lucide-react";

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

// Condições que afetam o dente inteiro (não por face)
const FULL_TOOTH_CONDITIONS = ["extraction", "missing", "implant", "crown", "prosthesis"];

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
  const isImplant = fullToothCondition === "implant";
  const isCrown = fullToothCondition === "crown";
  const isProsthesis = fullToothCondition === "prosthesis";

  const getToothVisualOverlay = () => {
    if (isMissing) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 rounded">
          <Minus className="h-4 w-4 text-gray-500" />
        </div>
      );
    }
    if (isExtraction) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <X className="h-8 w-8 text-gray-600 stroke-[3]" />
        </div>
      );
    }
    if (isImplant) {
      return (
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-4 rounded-b"
          style={{ backgroundColor: CONDITION_COLORS.implant }}
        />
      );
    }
    if (isCrown) {
      return (
        <div 
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-t-lg border-2"
          style={{ 
            backgroundColor: CONDITION_COLORS.crown,
            borderColor: CONDITION_COLORS.crown 
          }}
        />
      );
    }
    if (isProsthesis) {
      return (
        <div className="absolute inset-0 border-2 rounded" style={{ borderColor: CONDITION_COLORS.prosthesis }}>
          <div 
            className="absolute inset-1 rounded opacity-30"
            style={{ backgroundColor: CONDITION_COLORS.prosthesis }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all",
        "hover:bg-muted/50",
        selectedTool && "cursor-crosshair",
        hasRecords && "ring-1 ring-primary/30"
      )}
    >
      {/* Número do dente - superior */}
      {isUpper && (
        <span className="text-[10px] font-medium text-muted-foreground">
          {toothNumber}
        </span>
      )}

      {/* Representação visual do dente */}
      <div 
        className="relative"
        onClick={!selectedTool ? onToothClick : undefined}
      >
        {/* Raiz do dente (representação simplificada) */}
        <div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-b rounded-b-full",
            isUpper ? "-bottom-2" : "-top-2 rotate-180",
            isMissing && "opacity-30"
          )}
          style={{
            background: isMissing 
              ? "#d1d5db" 
              : isImplant 
                ? `linear-gradient(to ${isUpper ? 'bottom' : 'top'}, ${CONDITION_COLORS.implant}, ${CONDITION_COLORS.implant}88)`
                : `linear-gradient(to ${isUpper ? 'bottom' : 'top'}, #fef3c7, #fde68a)`
          }}
        />

        {/* Diagrama de faces do dente */}
        <ToothFaceDiagram
          toothNumber={toothNumber}
          faceConditions={faceConditions}
          selectedTool={selectedTool}
          onFaceClick={onFaceClick}
          size={40}
        />

        {/* Overlay para condições de dente inteiro */}
        {getToothVisualOverlay()}

        {/* Badge de quantidade de registros */}
        {recordCount > 0 && (
          <span className={cn(
            "absolute -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center",
            isUpper ? "-top-1" : "-bottom-1"
          )}>
            {recordCount}
          </span>
        )}
      </div>

      {/* Número do dente - inferior */}
      {!isUpper && (
        <span className="text-[10px] font-medium text-muted-foreground">
          {toothNumber}
        </span>
      )}
    </div>
  );
}

// Importação do ícone Minus para dente ausente
function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
