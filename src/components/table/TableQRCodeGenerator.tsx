import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TableQRCodeGeneratorProps {
  storeSlug: string;
  storeName: string;
  tableCount: number;
}

export function TableQRCodeGenerator({ storeSlug, storeName, tableCount }: TableQRCodeGeneratorProps) {
  const [copiedTable, setCopiedTable] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const getTableUrl = (tableNumber: number) => {
    return `${baseUrl}/mesa/${storeSlug}/${tableNumber}`;
  };

  const getQRCodeUrl = (tableNumber: number) => {
    const url = getTableUrl(tableNumber);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const copyLink = async (tableNumber: number) => {
    const url = getTableUrl(tableNumber);
    await navigator.clipboard.writeText(url);
    setCopiedTable(tableNumber);
    toast.success(`Link da Mesa ${tableNumber} copiado!`);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const downloadQRCode = async (tableNumber: number) => {
    const url = getQRCodeUrl(tableNumber);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `mesa-${tableNumber}-${storeSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success(`QR Code da Mesa ${tableNumber} baixado!`);
    } catch (error) {
      toast.error('Erro ao baixar QR Code');
    }
  };

  const printAllQRCodes = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: Arial, sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .card { border: 1px solid #ddd; padding: 15px; text-align: center; page-break-inside: avoid; }
        .card img { width: 120px; height: 120px; }
        .store-name { font-size: 12px; color: #666; margin-bottom: 5px; }
        .table-number { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .instructions { font-size: 10px; color: #888; }
      </style>
      <div class="grid">
        ${Array.from({ length: tableCount }, (_, i) => i + 1).map(num => `
          <div class="card">
            <div class="store-name">${storeName}</div>
            <img src="${getQRCodeUrl(num)}" alt="QR Code Mesa ${num}" />
            <div class="table-number">Mesa ${num}</div>
            <div class="instructions">Escaneie para fazer pedido</div>
          </div>
        `).join('')}
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">QR Codes das Mesas</h2>
          <p className="text-sm text-muted-foreground">
            {tableCount} {tableCount === 1 ? 'mesa configurada' : 'mesas configuradas'}
          </p>
        </div>
        <Button onClick={printAllQRCodes}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Todos
        </Button>
      </div>

      <div ref={printRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((tableNumber) => (
          <Card key={tableNumber} className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">{storeName}</p>
              <img 
                src={getQRCodeUrl(tableNumber)} 
                alt={`QR Code Mesa ${tableNumber}`}
                className="w-32 h-32 mx-auto"
              />
              <p className="text-xl font-bold mt-2">Mesa {tableNumber}</p>
              <p className="text-xs text-muted-foreground mb-3">Escaneie para pedir</p>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => copyLink(tableNumber)}
                >
                  {copiedTable === tableNumber ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => downloadQRCode(tableNumber)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
