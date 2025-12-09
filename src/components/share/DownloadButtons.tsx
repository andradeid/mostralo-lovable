import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  onPrint?: () => void;
}

export function DownloadButtons({ targetRef, filename, onPrint }: DownloadButtonsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    if (!targetRef.current) {
      window.print();
      return;
    }

    // Clonar conteúdo do template
    const printContent = targetRef.current.outerHTML;

    // Criar nova janela de impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Pop-up bloqueado. Permita pop-ups para imprimir.",
        variant: "destructive",
      });
      return;
    }

    // Escrever HTML com estilos
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <meta charset="UTF-8">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: flex-start;
            min-height: 100vh;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          @media print {
            body { 
              padding: 0;
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        ${printContent}
        <script>
          // Aguardar carregamento do Tailwind e imagens
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handlePrint} variant="default" className="gap-2">
        <Printer className="h-4 w-4" />Imprimir / Salvar PDF
      </Button>
    </div>
  );
}
