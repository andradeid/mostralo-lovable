import { toast } from "sonner";
import { Comanda, ComandaItem } from "@/hooks/useComandas";

interface PrintComandaConfig {
  printType: 'thermal_58mm' | 'thermal_80mm' | 'a4';
  fontSize: 'small' | 'medium' | 'large';
  showSeparators: boolean;
  boldTitles: boolean;
}

export interface StoreInfo {
  name: string;
  address?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  logo_url?: string | null;
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
  storeInfo: StoreInfo | string = { name: "Estabelecimento" },
  config: PrintComandaConfig = defaultConfig,
  viaType: 'cliente' | 'estabelecimento' = 'cliente'
): string {
  // Compatibilidade: se receber string, converter para StoreInfo
  const store: StoreInfo = typeof storeInfo === 'string' 
    ? { name: storeInfo } 
    : storeInfo;

  // Definir largura baseado no tipo de impressora
  let maxWidth = '210mm';
  if (config.printType === 'thermal_58mm') {
    maxWidth = '58mm';
  } else if (config.printType === 'thermal_80mm') {
    maxWidth = '80mm';
  }

  const viaName = viaType === 'cliente' ? 'CLIENTE' : 'ESTABELECIMENTO';

  // Labels de pagamento
  const paymentLabels: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'credito': 'Cartão de Crédito',
    'debito': 'Cartão de Débito',
    'pix': 'PIX',
    'outros': 'Outros'
  };

  const paymentMethod = comanda.payment_method || '';
  const paymentLabel = paymentLabels[paymentMethod] || paymentMethod;
  const receivedAmount = comanda.payment_details?.received_amount || comanda.total;
  const change = comanda.payment_details?.change || 0;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cupom #${comanda.number} - Via ${viaName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 8px;
      max-width: ${maxWidth};
      margin: 0 auto;
    }
    
    .via-badge {
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 8px;
      padding: 3px;
      border: 1px solid #000;
      background: #f0f0f0;
    }
    
    .header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .header h1 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .header p {
      font-size: 10px;
      margin: 2px 0;
    }
    
    .sale-number {
      text-align: center;
      padding: 10px 0;
      border-bottom: 1px dashed #000;
    }
    
    .sale-number strong {
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }
    
    .sale-number p {
      font-size: 10px;
    }
    
    .items-section {
      padding: 8px 0;
    }
    
    .items-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #000;
      margin-bottom: 6px;
    }
    
    .items-header span:first-child { width: 40%; }
    .items-header span:nth-child(2) { width: 15%; text-align: center; }
    .items-header span:nth-child(3) { width: 20%; text-align: right; }
    .items-header span:last-child { width: 25%; text-align: right; }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 3px 0;
      border-bottom: 1px dotted #ccc;
    }
    
    .item-row span:first-child { 
      width: 40%; 
      word-break: break-word;
    }
    .item-row span:nth-child(2) { width: 15%; text-align: center; }
    .item-row span:nth-child(3) { width: 20%; text-align: right; }
    .item-row span:last-child { width: 25%; text-align: right; }
    
    .item-notes {
      font-size: 9px;
      font-style: italic;
      color: #555;
      padding-left: 10px;
      margin-bottom: 4px;
    }
    
    .totals {
      padding: 10px 0;
      border-top: 1px dashed #000;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 2px 0;
    }
    
    .total-line.discount {
      color: #006600;
    }
    
    .grand-total {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #000;
      margin-top: 6px;
      padding-top: 6px;
    }
    
    .payment {
      padding: 10px 0;
      border-top: 1px dashed #000;
    }
    
    .payment-title {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 6px;
      text-align: center;
    }
    
    .payment-line {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 2px 0;
    }
    
    .footer {
      text-align: center;
      padding-top: 12px;
      border-top: 1px dashed #000;
      margin-top: 10px;
    }
    
    .footer p {
      margin: 4px 0;
    }
    
    .footer .thanks {
      font-size: 12px;
      font-weight: bold;
    }
    
    .footer .legal {
      font-size: 9px;
      font-style: italic;
      color: #666;
      margin-top: 8px;
    }
    
    .footer .credit {
      font-size: 8px;
      color: #888;
      margin-top: 10px;
    }
    
    @media print {
      body { padding: 0; }
      @page { 
        margin: 5mm; 
        size: ${maxWidth} auto;
      }
    }
  </style>
</head>
<body>
  <div class="via-badge">═══ VIA ${viaName} ═══</div>
  
  <!-- HEADER DA LOJA -->
  <div class="header">
    <h1>${store.name}</h1>
    ${store.address ? `<p>${store.address}</p>` : ''}
    ${store.city && store.state ? `<p>${store.city} - ${store.state}</p>` : ''}
    ${store.phone ? `<p>Tel: ${store.phone}</p>` : ''}
  </div>
  
  <!-- NÚMERO DA VENDA -->
  <div class="sale-number">
    <strong>CUPOM DE VENDA #${comanda.number}</strong>
    <p>${formatDateTime(comanda.opened_at)}</p>
    ${comanda.type === 'mesa' && comanda.table_number ? `<p>Mesa: ${comanda.table_number}</p>` : ''}
    ${comanda.customer_name ? `<p>Cliente: ${comanda.customer_name}</p>` : ''}
  </div>
  
  <!-- ITENS -->
  <div class="items-section">
    <div class="items-header">
      <span>ITEM</span>
      <span>QTD</span>
      <span>VL UN</span>
      <span>VL ITEM</span>
    </div>
`;

  // Renderizar itens
  if (items.length === 0) {
    html += `<p style="text-align: center; font-style: italic; padding: 10px 0;">Nenhum item</p>`;
  } else {
    items.forEach(item => {
      html += `
    <div class="item-row">
      <span>${item.product_name}</span>
      <span>${item.quantity}</span>
      <span>${formatCurrency(item.unit_price)}</span>
      <span>${formatCurrency(item.total_price)}</span>
    </div>
`;
      if (item.notes) {
        html += `<div class="item-notes">Obs: ${item.notes}</div>`;
      }
    });
  }

  html += `
  </div>
  
  <!-- TOTAIS -->
  <div class="totals">
    <div class="total-line">
      <span>Subtotal</span>
      <span>${formatCurrency(comanda.subtotal)}</span>
    </div>
`;

  if (comanda.service_fee > 0) {
    const percentage = comanda.subtotal > 0 ? ((comanda.service_fee / comanda.subtotal) * 100).toFixed(0) : '10';
    html += `
    <div class="total-line">
      <span>Taxa de Serviço (${percentage}%)</span>
      <span>${formatCurrency(comanda.service_fee)}</span>
    </div>
`;
  }

  if (comanda.discount > 0) {
    html += `
    <div class="total-line discount">
      <span>Desconto</span>
      <span>-${formatCurrency(comanda.discount)}</span>
    </div>
`;
  }

  html += `
    <div class="total-line grand-total">
      <span>TOTAL R$</span>
      <span>${formatCurrency(comanda.total)}</span>
    </div>
  </div>
`;

  // Seção de pagamento (se fechada)
  if (comanda.status === 'closed' && comanda.payment_method) {
    html += `
  <!-- PAGAMENTO -->
  <div class="payment">
    <div class="payment-title">FORMA DE PAGAMENTO</div>
    <div class="payment-line">
      <span>${paymentLabel}</span>
      <span>${formatCurrency(receivedAmount)}</span>
    </div>
`;
    if (change > 0) {
      html += `
    <div class="payment-line">
      <span>Troco</span>
      <span>${formatCurrency(change)}</span>
    </div>
`;
    }
    if (comanda.closed_at) {
      html += `
    <div class="payment-line" style="font-size: 9px; color: #666;">
      <span>Fechada em:</span>
      <span>${formatDateTime(comanda.closed_at)}</span>
    </div>
`;
    }
    html += `
  </div>
`;
  }

  // Footer
  html += `
  <!-- FOOTER -->
  <div class="footer">
    <p class="thanks">Obrigado pela preferência!</p>
    <p class="legal">Documento sem valor fiscal</p>
    <p class="credit">Feito por Mostralo - 2026</p>
  </div>
</body>
</html>
`;

  return html;
}

export async function printComanda(
  comanda: Comanda,
  items: ComandaItem[],
  storeInfo: StoreInfo | string = { name: "Estabelecimento" },
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
      combinedHTML += generateComandaHTML(comanda, items, storeInfo, config, 'cliente');
    }

    if (viaType === 'ambas') {
      combinedHTML += getCutLineSeparator(config.printType);
    }

    if (viaType === 'ambas' || viaType === 'estabelecimento') {
      combinedHTML += generateComandaHTML(comanda, items, storeInfo, config, 'estabelecimento');
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
