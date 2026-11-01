// Botões "CSV" e "PDF" da tela de Relatórios da loja.
import type { DateRange } from '@/components/admin/reports/types';
import { loadStoreReport } from './loadStoreReport';
import {
  buildStoreReportCsvRows,
  buildStoreReportHtml,
  buildStoreReportSections,
  reportFileBaseName,
  toCsv,
  type ReportMeta,
} from './storeReport';

async function prepare(storeId: string, dateRange: DateRange, storeName?: string | null) {
  const { raw, storeName: name, storeSlug } = await loadStoreReport(storeId, dateRange, storeName);
  const meta: ReportMeta = { storeName: name, from: dateRange.from, to: dateRange.to, generatedAt: new Date() };
  return {
    meta,
    sections: buildStoreReportSections(raw),
    fileBase: reportFileBaseName(storeSlug || name, dateRange.from, dateRange.to),
  };
}

export async function exportStoreReportCsv(storeId: string, dateRange: DateRange, storeName?: string | null): Promise<void> {
  const { meta, sections, fileBase } = await prepare(storeId, dateRange, storeName);
  // toCsv já inclui o BOM UTF-8
  const blob = new Blob([toCsv(buildStoreReportCsvRows(meta, sections))], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileBase}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre a janela de impressão do navegador com o relatório formatado ("Salvar como PDF"). */
export async function exportStoreReportPdf(storeId: string, dateRange: DateRange, storeName?: string | null): Promise<void> {
  const { meta, sections, fileBase } = await prepare(storeId, dateRange, storeName);
  const html = buildStoreReportHtml(meta, sections, fileBase);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error('Não foi possível preparar a impressão');
  }
  doc.open();
  doc.write(html);
  doc.close();

  // O nome sugerido do PDF vem do título da página
  const previousTitle = document.title;
  document.title = fileBase;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.title = previousTitle;
    iframe.remove();
  };
  win.addEventListener('afterprint', () => setTimeout(cleanup, 100));

  await new Promise(resolve => setTimeout(resolve, 50));
  win.focus();
  win.print();
  // Navegadores que não disparam afterprint
  setTimeout(cleanup, 60_000);
}
