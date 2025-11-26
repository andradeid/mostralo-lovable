import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContents: string[];
  viaNames: string[];
  onConfirmPrint: () => void;
}

export function PrintPreviewDialog({
  open,
  onOpenChange,
  htmlContents,
  viaNames,
  onConfirmPrint,
}: PrintPreviewDialogProps) {
  const [currentViaIndex, setCurrentViaIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (open) {
      setCurrentViaIndex(0);
      setZoom(100);
    }
  }, [open]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(100);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentViaIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentViaIndex((prev) => Math.min(htmlContents.length - 1, prev + 1));
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmPrint();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Pré-visualização de Impressão</DialogTitle>
              <Badge variant="secondary">
                Via {currentViaIndex + 1} de {htmlContents.length}: {viaNames[currentViaIndex]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Controles de navegação e zoom */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentViaIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentViaIndex === htmlContents.length - 1}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetZoom}
              title="Resetar zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Área de visualização */}
        <ScrollArea className="flex-1 p-6">
          <div
            className="mx-auto bg-white shadow-lg"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: htmlContents[currentViaIndex] }}
              className="print-preview-content"
            />
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
