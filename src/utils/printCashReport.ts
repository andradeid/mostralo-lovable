import { toast } from 'sonner';
import { buildCashReportLines, escapeHtml, type CashReportInput, type ReportLine } from '@/lib/pdvCash/cashReport';

function lineToHtml(line: ReportLine): string {
  switch (line.kind) {
    case 'title':
      return `<div class="title">${escapeHtml(line.text)}</div>`;
    case 'text':
      return `<div class="text">${escapeHtml(line.text)}</div>`;
    case 'separator':
      return '<div class="sep"></div>';
    case 'row':
      return `<div class="row${line.strong ? ' strong' : ''}"><span>${escapeHtml(line.label)}</span><span>${escapeHtml(line.value)}</span></div>`;
  }
}

/** HTML do relatório de caixa em 80mm (mesmo estilo do cupom da comanda). */
export function generateCashReportHTML(input: CashReportInput): string {
  const body = buildCashReportLines(input).map(lineToHtml).join('\n');
  const printedAt = new Date().toLocaleString('pt-BR', input.timeZone ? { timeZone: input.timeZone } : undefined);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de caixa</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; color: #000; background: #fff; padding: 8px; max-width: 80mm; margin: 0 auto; }
    .title { text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 2px; }
    .text { font-weight: bold; margin: 4px 0 2px; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .row span:last-child { white-space: nowrap; text-align: right; }
    .row.strong { font-weight: bold; }
    .footer { text-align: center; font-size: 9px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
${body}
  <div class="footer">
    <p>Impresso em ${escapeHtml(printedAt)}</p>
    <p>Documento sem valor fiscal</p>
    <p>Feito por Mostralo</p>
  </div>
</body>
</html>`;
}

export function printCashReport(input: CashReportInput) {
  try {
    const html = generateCashReportHTML(input);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão', {
        description: 'Verifique se o bloqueador de pop-ups está ativado',
      });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  } catch (error) {
    console.error('Erro ao imprimir relatório de caixa:', error);
    toast.error('Erro ao preparar impressão');
  }
}
