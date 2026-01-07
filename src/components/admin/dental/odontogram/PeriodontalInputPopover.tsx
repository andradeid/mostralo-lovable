import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getPeriodontalClassification } from "@/hooks/dental/usePeriodontalRecords";
import { Droplets, Trash2 } from "lucide-react";

interface PeriodontalInputPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number;
  position: string;
  currentPocketDepth?: number;
  currentRecession?: number;
  currentBleeding?: boolean;
  onSave: (data: { pocketDepth: number; recession: number; bleeding: boolean }) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

const POSITION_LABELS: Record<string, string> = {
  V: "Vestibular",
  L: "Lingual/Palatino",
  M: "Mesial",
  D: "Distal",
  MV: "Mésio-Vestibular",
  DV: "Disto-Vestibular",
  ML: "Mésio-Lingual",
  DL: "Disto-Lingual",
};

export function PeriodontalInputPopover({
  open,
  onOpenChange,
  toothNumber,
  position,
  currentPocketDepth = 0,
  currentRecession = 0,
  currentBleeding = false,
  onSave,
  onDelete,
  children,
}: PeriodontalInputPopoverProps) {
  const [pocketDepth, setPocketDepth] = useState(currentPocketDepth);
  const [recession, setRecession] = useState(currentRecession);
  const [bleeding, setBleeding] = useState(currentBleeding);

  useEffect(() => {
    if (open) {
      setPocketDepth(currentPocketDepth);
      setRecession(currentRecession);
      setBleeding(currentBleeding);
    }
  }, [open, currentPocketDepth, currentRecession, currentBleeding]);

  const classification = getPeriodontalClassification(pocketDepth);

  const handleSave = () => {
    onSave({ pocketDepth, recession, bleeding });
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="top" align="center">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Dente {toothNumber}</h4>
              <p className="text-xs text-muted-foreground">
                Face {POSITION_LABELS[position] || position}
              </p>
            </div>
            <div
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: classification.color }}
            >
              {pocketDepth}mm
            </div>
          </div>

          {/* Pocket Depth Slider */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Profundidade da bolsa: {pocketDepth}mm
            </Label>
            <Slider
              value={[pocketDepth]}
              onValueChange={([v]) => setPocketDepth(v)}
              min={0}
              max={15}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0mm</span>
              <span style={{ color: "#22c55e" }}>●3</span>
              <span style={{ color: "#eab308" }}>●5</span>
              <span style={{ color: "#ef4444" }}>●10</span>
              <span>15mm</span>
            </div>
          </div>

          {/* Recession Slider */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Retração gengival: {recession}mm
            </Label>
            <Slider
              value={[recession]}
              onValueChange={([v]) => setRecession(v)}
              min={0}
              max={15}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0mm</span>
              <span>15mm</span>
            </div>
          </div>

          {/* Bleeding Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bleeding"
              checked={bleeding}
              onCheckedChange={(checked) => setBleeding(checked === true)}
            />
            <Label htmlFor="bleeding" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <Droplets className="h-3.5 w-3.5 text-red-500" />
              Sangramento à sondagem
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onDelete && currentPocketDepth !== undefined && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
