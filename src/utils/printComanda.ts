import { toast } from "sonner";
import { Comanda, ComandaItem } from "@/hooks/useComandas";

interface PrintComandaConfig {
  printType: 'thermal_58mm' | 'thermal_80mm' | 'a4';
  fontSize: 'small' | 'medium' | 'large';
  showSeparators: boolean;
  boldTitles: boolean;
}

const defaultConfig: PrintComandaConfig = {
  printType: 'thermal_80mm',
  fontSize: 'medium',
  showSeparators: true,
  boldTitles: true,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR');
}

function getCutLineSeparator(printType: string): string {
  if (printType === 'thermal_58mm' || printType === 'thermal_80mm') {
    return `
      <div style="
        margin: 20px 0;
        padding: 15px 0;
        border-top: 2px dashed #000;
        border-bottom: 2px dashed #000;
        text-align: center;
        page-break-inside: avoid;
      ">
        <span style="font-size: 16px; font-weight: bold;">✂️ ─────── CORTE AQUI ─────── ✂️</span>
      </div>
    `;
  }
  return '<div style="page-break-before: always;"></div>';
}

export interface PrintComandaOptions {
  preview?: boolean;
  onPreviewReady?: (htmlContent: string) => void;
  viaType?: 'cliente' | 'estabelecimento' | 'ambas';
}

export function generateComandaHTML(
  comanda: Comanda,
  items: ComandaItem[],
  storeName: string = "Estabelecimento",
  config: PrintComandaConfig = defaultConfig,
  viaType: 'cliente' | 'estabelecimento' = 'cliente'
): string {
  // Definir largura baseado no tipo de impressora
  let maxWidth = '210mm';
  if (config.printType === 'thermal_58mm') {
    maxWidth = '58mm';
  } else if (config.printType === 'thermal_80mm') {
    maxWidth = '80mm';
  }

  // Tamanho da fonte
  const fontSizeMap = {
    small: '10px',
    medium: '12px',
    large: '14px'
  };
  const fontSize = fontSizeMap[config.fontSize] || '12px';

  const separator = config.showSeparators ? '<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>' : '';
  const titleStyle = config.boldTitles ? 'font-weight: bold;' : '';

  const viaName = viaType === 'cliente' ? 'CLIENTE' : 'ESTABELECIMENTO';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comanda #${comanda.number} - Via ${viaName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 10px;
      max-width: ${maxWidth};
      margin: 0 auto;
    }
    .separator { border-top: 1px dashed #000; margin: 10px 0; }
    .bold { font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item { margin: 5px 0; }
    .via-header { 
      text-align: center; 
      font-weight: bold; 
      font-size: 1.2em; 
      margin-bottom: 10px;
      padding: 5px;
      border: 2px solid #000;
      background: #f0f0f0;
    }
    .section { margin-bottom: 10px; }
    @media print {
      body { padding: 0; }
      @page { 
        margin: 10mm; 
        size: ${maxWidth} auto;
      }
    }
  </style>
</head>
<body>
  <div class="via-header">═══ VIA ${viaName} ═══</div>
  ${separator}
`;

  // Header
  html += `
  <div class="section text-center" style="${titleStyle}">
    <h2>${storeName}</h2>
    <p style="font-size: 0.9em; margin-top: 5px;">COMANDA</p>
  </div>
  ${separator}
`;

  // Info da Comanda
  html += `
  <div class="section" style="${titleStyle}">
    <p style="font-size: 1.5em; font-weight: bold; text-align: center;">COMANDA #${comanda.number}</p>
    <p>Data/Hora: ${formatDateTime(comanda.opened_at)}</p>
    <p>Tipo: ${comanda.type === 'mesa' ? `Mesa ${comanda.table_number}` : 'Balcão'}</p>
    ${comanda.customer_name ? `<p>Cliente: ${comanda.customer_name}</p>` : ''}
    <p>Status: ${comanda.status === 'open' ? 'ABERTA' : comanda.status === 'closed' ? 'FECHADA' : 'CANCELADA'}</p>
  </div>
  ${separator}
`;

  // Itens
  html += `
  <div class="section">
    <p class="bold" style="margin-bottom: 8px;">ITENS:</p>
`;

  if (items.length === 0) {
    html += `<p style="text-align: center; font-style: italic;">Nenhum item adicionado</p>`;
  } else {
    items.forEach(item => {
      html += `
    <div class="item" style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <span>${item.quantity}x ${item.product_name}</span>
        <span>${formatCurrency(item.total_price)}</span>
      </div>
      ${item.notes ? `<div style="font-size: 0.85em; font-style: italic; margin-left: 15px;">Obs: ${item.notes}</div>` : ''}
    </div>
`;
    });
  }

  html += `
  </div>
  ${separator}
`;

  // Totais
  html += `
  <div class="section">
    <div style="display: flex; justify-content: space-between;">
      <span>Subtotal:</span>
      <span>${formatCurrency(comanda.subtotal)}</span>
    </div>
`;

  if (comanda.service_fee > 0) {
    const percentage = comanda.subtotal > 0 ? ((comanda.service_fee / comanda.subtotal) * 100).toFixed(0) : '10';
    html += `
    <div style="display: flex; justify-content: space-between;">
      <span>Taxa de Serviço (${percentage}%):</span>
      <span>${formatCurrency(comanda.service_fee)}</span>
    </div>
`;
  }

  if (comanda.discount > 0) {
    html += `
    <div style="display: flex; justify-content: space-between; color: green;">
      <span>Desconto:</span>
      <span>-${formatCurrency(comanda.discount)}</span>
    </div>
`;
  }

  html += `
    <div style="display: flex; justify-content: space-between; font-size: 1.3em; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 1px solid #000;">
      <span>TOTAL:</span>
      <span>${formatCurrency(comanda.total)}</span>
    </div>
  </div>
  ${separator}
`;

  // Pagamento (se fechada)
  if (comanda.status === 'closed' && comanda.payment_method) {
    const paymentLabels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'credito': 'Cartão de Crédito',
      'debito': 'Cartão de Débito',
      'pix': 'PIX',
      'outros': 'Outros'
    };
    html += `
  <div class="section">
    <p class="bold">PAGAMENTO:</p>
    <p>Forma: ${paymentLabels[comanda.payment_method] || comanda.payment_method}</p>
`;
    if (comanda.payment_details?.received_amount) {
      html += `
    <p>Recebido: ${formatCurrency(comanda.payment_details.received_amount)}</p>
    <p>Troco: ${formatCurrency(comanda.payment_details.change || 0)}</p>
`;
    }
    if (comanda.closed_at) {
      html += `<p>Fechada em: ${formatDateTime(comanda.closed_at)}</p>`;
    }
    html += `
  </div>
  ${separator}
`;
  }

  // Footer
  html += `
  <div class="section text-center" style="margin-top: 15px;">
    <p style="font-size: 0.9em;">Obrigado pela preferência!</p>
    <p style="font-size: 0.8em; margin-top: 5px;">${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>
`;

  return html;
}

export async function printComanda(
  comanda: Comanda,
  items: ComandaItem[],
  storeName: string = "Estabelecimento",
  options: PrintComandaOptions = {}
) {
  try {
    if (!options.preview) {
      toast.info('Preparando impressão da comanda...');
    }

    const config = defaultConfig;
    const viaType = options.viaType || 'ambas';

    let combinedHTML = '';

    if (viaType === 'ambas' || viaType === 'cliente') {
      combinedHTML += generateComandaHTML(comanda, items, storeName, config, 'cliente');
    }

    if (viaType === 'ambas') {
      combinedHTML += getCutLineSeparator(config.printType);
    }

    if (viaType === 'ambas' || viaType === 'estabelecimento') {
      combinedHTML += generateComandaHTML(comanda, items, storeName, config, 'estabelecimento');
    }

    // Se modo preview, retornar HTML
    if (options.preview && options.onPreviewReady) {
      options.onPreviewReady(combinedHTML);
      return;
    }

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(combinedHTML);
      printWindow.document.close();
      printWindow.focus();
      
      toast.success('Impressão aberta! Finalize na janela de impressão.');
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } else {
      toast.error('Não foi possível abrir a janela de impressão', {
        description: 'Verifique se o bloqueador de pop-ups está ativado'
      });
    }
  } catch (error) {
    console.error('Erro ao imprimir comanda:', error);
    toast.error("Erro ao preparar impressão");
  }
}
