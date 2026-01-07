import { cn } from "@/lib/utils";

interface ToothFaceDiagramProps {
  toothNumber: number;
  faceConditions: Record<string, string>;
  selectedTool: string | null;
  onFaceClick: (face: string) => void;
  size?: number;
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

const DEFAULT_COLOR = "#ffffff";
const STROKE_COLOR = "#374151";

export function ToothFaceDiagram({
  toothNumber,
  faceConditions,
  selectedTool,
  onFaceClick,
  size = 40,
}: ToothFaceDiagramProps) {
  const getFaceColor = (face: string): string => {
    const condition = faceConditions[face];
    if (!condition) return DEFAULT_COLOR;
    return CONDITION_COLORS[condition] || DEFAULT_COLOR;
  };

  const handleFaceClick = (e: React.MouseEvent, face: string) => {
    e.stopPropagation();
    onFaceClick(face);
  };

  // Determina se é um dente anterior (incisivos e caninos) - usa "I" ao invés de "O"
  const isAnterior = [11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43].includes(toothNumber);
  const centerLabel = isAnterior ? "I" : "O";
  const centerFace = isAnterior ? "I" : "O";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="cursor-pointer"
    >
      {/* Vestibular (topo) */}
      <polygon
        points="10,10 50,10 90,10 75,35 25,35"
        fill={getFaceColor("V")}
        stroke={STROKE_COLOR}
        strokeWidth="2"
        onClick={(e) => handleFaceClick(e as any, "V")}
        className={cn(
          "transition-all hover:opacity-80",
          selectedTool && "hover:stroke-primary hover:stroke-[3]"
        )}
      />

      {/* Mesial (esquerda) */}
      <polygon
        points="10,10 25,35 25,65 10,90"
        fill={getFaceColor("M")}
        stroke={STROKE_COLOR}
        strokeWidth="2"
        onClick={(e) => handleFaceClick(e as any, "M")}
        className={cn(
          "transition-all hover:opacity-80",
          selectedTool && "hover:stroke-primary hover:stroke-[3]"
        )}
      />

      {/* Distal (direita) */}
      <polygon
        points="90,10 90,90 75,65 75,35"
        fill={getFaceColor("D")}
        stroke={STROKE_COLOR}
        strokeWidth="2"
        onClick={(e) => handleFaceClick(e as any, "D")}
        className={cn(
          "transition-all hover:opacity-80",
          selectedTool && "hover:stroke-primary hover:stroke-[3]"
        )}
      />

      {/* Lingual/Palatina (baixo) */}
      <polygon
        points="10,90 25,65 75,65 90,90"
        fill={getFaceColor("L")}
        stroke={STROKE_COLOR}
        strokeWidth="2"
        onClick={(e) => handleFaceClick(e as any, "L")}
        className={cn(
          "transition-all hover:opacity-80",
          selectedTool && "hover:stroke-primary hover:stroke-[3]"
        )}
      />

      {/* Oclusal/Incisal (centro) */}
      <polygon
        points="25,35 75,35 75,65 25,65"
        fill={getFaceColor(centerFace)}
        stroke={STROKE_COLOR}
        strokeWidth="2"
        onClick={(e) => handleFaceClick(e as any, centerFace)}
        className={cn(
          "transition-all hover:opacity-80",
          selectedTool && "hover:stroke-primary hover:stroke-[3]"
        )}
      />

      {/* Labels das faces - visíveis apenas em tamanho maior */}
      {size >= 50 && (
        <>
          <text x="50" y="25" textAnchor="middle" fontSize="10" fill={STROKE_COLOR} className="pointer-events-none select-none">V</text>
          <text x="17" y="55" textAnchor="middle" fontSize="10" fill={STROKE_COLOR} className="pointer-events-none select-none">M</text>
          <text x="83" y="55" textAnchor="middle" fontSize="10" fill={STROKE_COLOR} className="pointer-events-none select-none">D</text>
          <text x="50" y="82" textAnchor="middle" fontSize="10" fill={STROKE_COLOR} className="pointer-events-none select-none">L</text>
          <text x="50" y="55" textAnchor="middle" fontSize="10" fill={STROKE_COLOR} className="pointer-events-none select-none">{centerLabel}</text>
        </>
      )}
    </svg>
  );
}
