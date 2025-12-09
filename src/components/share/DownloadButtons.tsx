import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface DownloadButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  onPrint?: () => void;
}

export function DownloadButtons({ onPrint }: DownloadButtonsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handlePrint} variant="default" className="gap-2">
        <Printer className="h-4 w-4" />Imprimir / Salvar PDF
      </Button>
    </div>
  );
}
