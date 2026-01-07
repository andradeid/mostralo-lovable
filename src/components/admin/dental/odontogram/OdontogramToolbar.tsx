import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Circle, 
  X, 
  Minus, 
  Square, 
  Diamond,
  Zap,
  AlertTriangle,
  Move,
  Eraser,
  RotateCcw
} from "lucide-react";

interface OdontogramToolbarProps {
  selectedTool: string | null;
  onSelectTool: (tool: string | null) => void;
}

export const ODONTOGRAM_TOOLS = [
  { id: "healthy", icon: Circle, label: "Saudável", color: "#22c55e" },
  { id: "caries", icon: AlertTriangle, label: "Cárie", color: "#ef4444" },
  { id: "restoration", icon: Square, label: "Restauração", color: "#3b82f6" },
  { id: "extraction", icon: X, label: "Extração", color: "#6b7280" },
  { id: "missing", icon: Minus, label: "Ausente", color: "#d1d5db" },
  { id: "implant", icon: Diamond, label: "Implante", color: "#8b5cf6" },
  { id: "crown", icon: Circle, label: "Coroa", color: "#f59e0b" },
  { id: "endodontic", icon: Zap, label: "Canal", color: "#ec4899" },
  { id: "prosthesis", icon: Square, label: "Prótese", color: "#14b8a6" },
  { id: "fracture", icon: AlertTriangle, label: "Fratura", color: "#f97316" },
  { id: "periapical", icon: Circle, label: "Lesão Periapical", color: "#dc2626" },
  { id: "mobility", icon: Move, label: "Mobilidade", color: "#eab308" },
] as const;

export function OdontogramToolbar({ selectedTool, onSelectTool }: OdontogramToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/50 rounded-lg border">
      {ODONTOGRAM_TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isSelected = selectedTool === tool.id;
        
        return (
          <Button
            key={tool.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTool(isSelected ? null : tool.id)}
            className={cn(
              "h-8 px-2 gap-1.5 text-xs",
              isSelected && "ring-2 ring-offset-1"
            )}
            style={{
              borderColor: tool.color,
              ...(isSelected && { backgroundColor: tool.color, borderColor: tool.color })
            }}
            title={tool.label}
          >
            <Icon 
              className="h-3.5 w-3.5" 
              style={{ color: isSelected ? "#fff" : tool.color }}
            />
            <span className={cn(
              "hidden sm:inline",
              isSelected ? "text-white" : "text-foreground"
            )}>
              {tool.label}
            </span>
          </Button>
        );
      })}
      
      {/* Borracha - remove condição */}
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant={selectedTool === "eraser" ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectTool(selectedTool === "eraser" ? null : "eraser")}
        className="h-8 px-2 gap-1.5 text-xs"
        title="Remover condição"
      >
        <Eraser className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Apagar</span>
      </Button>

      {/* Limpar seleção */}
      {selectedTool && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectTool(null)}
          className="h-8 px-2 gap-1.5 text-xs"
          title="Cancelar seleção (ESC)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cancelar</span>
        </Button>
      )}
    </div>
  );
}
