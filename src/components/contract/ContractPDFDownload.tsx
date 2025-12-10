import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractPDFDownloadProps {
  contractRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
}

export function ContractPDFDownload({ contractRef, fileName = "contrato" }: ContractPDFDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    if (!contractRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir janela de impressão. Permita pop-ups.",
        variant: "destructive",
      });
      return;
    }

    const content = contractRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 15mm;
              font-size: 11pt;
              line-height: 1.5;
              color: #1a1a1a;
            }
            h1, h2, h3 {
              margin-bottom: 8px;
            }
            p {
              margin-bottom: 8px;
            }
            .bg-gradient-to-r {
              background: linear-gradient(to right, #f0f9ff, #e0f2fe);
              padding: 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            .flex {
              display: flex;
            }
            .items-center {
              align-items: center;
            }
            .gap-4 {
              gap: 16px;
            }
            .gap-2 {
              gap: 8px;
            }
            .p-3 {
              padding: 12px;
            }
            .p-6 {
              padding: 24px;
            }
            .p-4 {
              padding: 16px;
            }
            .rounded-full {
              border-radius: 9999px;
            }
            .rounded-lg {
              border-radius: 8px;
            }
            .border {
              border: 1px solid #e5e7eb;
            }
            .border-t {
              border-top: 1px solid #e5e7eb;
            }
            .border-b {
              border-bottom: 1px solid #e5e7eb;
            }
            .space-y-4 > * + * {
              margin-top: 16px;
            }
            .space-y-2 > * + * {
              margin-top: 8px;
            }
            .text-xl {
              font-size: 1.25rem;
            }
            .text-lg {
              font-size: 1.125rem;
            }
            .text-sm {
              font-size: 0.875rem;
            }
            .text-xs {
              font-size: 0.75rem;
            }
            .font-bold {
              font-weight: 700;
            }
            .font-semibold {
              font-weight: 600;
            }
            .font-medium {
              font-weight: 500;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .ml-auto {
              margin-left: auto;
            }
            .ml-10 {
              margin-left: 40px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .pt-6 {
              padding-top: 24px;
            }
            .pt-4 {
              padding-top: 16px;
            }
            .py-4 {
              padding-top: 16px;
              padding-bottom: 16px;
            }
            .uppercase {
              text-transform: uppercase;
            }
            .tracking-wide {
              letter-spacing: 0.05em;
            }
            .whitespace-pre-wrap {
              white-space: pre-wrap;
            }
            .text-muted-foreground {
              color: #6b7280;
            }
            .text-green-500 {
              color: #22c55e;
            }
            .text-primary {
              color: #f97316;
            }
            .bg-primary\\/10 {
              background-color: rgba(249, 115, 22, 0.1);
            }
            .bg-muted\\/50 {
              background-color: rgba(243, 244, 246, 0.5);
            }
            .bg-muted\\/30 {
              background-color: rgba(243, 244, 246, 0.3);
            }
            .bg-muted {
              background-color: #f3f4f6;
            }
            .border-dashed {
              border-style: dashed;
            }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handlePrint} variant="outline">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir/PDF
      </Button>
    </div>
  );
}
