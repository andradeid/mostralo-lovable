import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  onPrint?: () => void;
}

export function DownloadButtons({ targetRef, filename, onPrint }: DownloadButtonsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const downloadAsImage = async (format: 'png' | 'jpg') => {
    if (!targetRef.current) {
      toast({ title: "Erro", description: "Elemento não encontrado", variant: "destructive" });
      return;
    }

    toast({ title: "Gerando imagem...", description: "Aguarde enquanto preparamos o arquivo." });

    try {
      // @ts-ignore - dynamic import
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${format}`;
      link.click();

      toast({ title: "Sucesso!", description: `Arquivo baixado.` });
    } catch {
      toast({ title: "Use a impressão", description: "Clique em Imprimir e salve como imagem.", variant: "destructive" });
    }
  };

  const downloadAsPDF = async () => {
    if (!targetRef.current) return;

    toast({ title: "Gerando PDF...", description: "Aguarde..." });

    try {
      // @ts-ignore - dynamic import
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(targetRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      
      // @ts-ignore - dynamic import
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min((pdfWidth - 20) / canvas.width, (pdfHeight - 20) / canvas.height);
      const imgX = (pdfWidth - canvas.width * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 10, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${filename}.pdf`);

      toast({ title: "Sucesso!", description: "PDF baixado." });
    } catch {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handlePrint} variant="default" className="gap-2">
        <Printer className="h-4 w-4" />Imprimir
      </Button>
      <Button onClick={() => downloadAsImage('png')} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />PNG
      </Button>
      <Button onClick={() => downloadAsImage('jpg')} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />JPG
      </Button>
      <Button onClick={downloadAsPDF} variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />PDF
      </Button>
    </div>
  );
}