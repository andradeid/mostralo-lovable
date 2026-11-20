// Etiquetas com código de barras das combinações da grade (uma por peça em estoque).
// Folha simples em grade de 40 × 25 mm (serve em impressora comum ou térmica de etiqueta).
import { toast } from 'sonner';
import { barcodeSvg } from '@/lib/grade/barcodeLabel';
import { escapeHtml } from '@/lib/pdvCash/cashReport';

export interface LabelItem {
  productName: string;
  variantName: string;
  barcode: string;
  price: number;
  copies: number;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function generateGradeLabelsHTML(items: LabelItem[]): string {
  const labels = items.flatMap((it) =>
    Array.from({ length: Math.max(0, Math.min(500, Math.floor(it.copies))) }, () => `
      <div class="label">
        <div class="name">${escapeHtml(it.productName)}</div>
        <div class="variant">${escapeHtml(it.variantName)}</div>
        <div class="bars">${barcodeSvg(it.barcode, 34, 1)}</div>
        <div class="foot"><span>${escapeHtml(it.barcode)}</span><strong>${escapeHtml(brl(it.price))}</strong></div>
      </div>`),
  ).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Etiquetas</title><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 4mm; }
    .sheet { display: flex; flex-wrap: wrap; gap: 2mm; }
    .label { width: 40mm; height: 25mm; border: 0.2mm dashed #bbb; padding: 1.2mm; display: flex; flex-direction: column; overflow: hidden; break-inside: avoid; }
    .name { font-size: 7pt; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .variant { font-size: 8pt; font-weight: bold; }
    .bars { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .bars svg { max-width: 100%; height: 9mm; }
    .foot { display: flex; justify-content: space-between; font-size: 6.5pt; }
    @media print { body { padding: 0; } .label { border-color: transparent; } }
  </style></head><body><div class="sheet">${labels}</div></body></html>`;
}

export function printGradeLabels(items: LabelItem[]) {
  const usable = items.filter((i) => i.barcode && i.copies > 0);
  if (!usable.length) {
    toast.error('Nenhuma etiqueta para imprimir', { description: 'Gere os códigos e informe o estoque das combinações.' });
    return;
  }
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Não foi possível abrir a janela de impressão', { description: 'Verifique se o bloqueador de pop-ups está ativado' });
    return;
  }
  w.document.write(generateGradeLabelsHTML(usable));
  w.document.close();
  w.focus();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}
