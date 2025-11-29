import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  delivery_type: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes?: string;
  created_at: string;
  store_id: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

interface OrderAddon {
  order_item_id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface PrintConfig {
  document_type: string;
  print_type: string;
  sections: {
    header: boolean;
    orderInfo: boolean;
    customerInfo: boolean;
    items: boolean;
    totals: boolean;
    payment: boolean;
    footer: boolean;
  };
  styles: {
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;
    headerAlign: 'left' | 'center' | 'right';
    itemsAlign: 'left' | 'center' | 'right';
    boldTitles: boolean;
    showSeparators: boolean;
  };
  custom_texts: {
    headerText: string;
    footerText: string;
  };
  print_copies?: {
    complete: boolean;
    kitchen: boolean;
    delivery: boolean;
  };
}

/**
 * Retorna o separador apropriado entre vias baseado no tipo de impressora
 */
function getCutLineSeparator(printType: string): string {
  // Para impressoras térmicas, usar linha de corte visual
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
  // Para A4, usar page-break tradicional
  return '<div style="page-break-before: always;"></div>';
}

function shouldHideCustomerPhone(documentType: string): boolean {
  return documentType === 'delivery';
}

function getDocumentTypeName(documentType: string): string {
  const names: Record<string, string> = {
    'complete': 'COMPLETA',
    'kitchen': 'COZINHA',
    'delivery': 'ENTREGADOR'
  };
  return names[documentType] || documentType.toUpperCase();
}

function getAdaptedSections(documentType: string, baseSections: any) {
  switch(documentType) {
    case 'kitchen':
      return {
        header: true,
        orderInfo: true,
        customerInfo: false,
        items: true,
        totals: false,
        payment: false,
        footer: false
      };
    
    case 'delivery':
      return {
        header: true,
        orderInfo: true,
        customerInfo: true,
        items: true,
        totals: true,
        payment: false,
        footer: false
      };
    
    case 'complete':
    default:
      return baseSections;
  }
}

export interface PrintOrderOptions {
  preview?: boolean;
  onPreviewReady?: (htmlContents: string[], viaNames: string[]) => void;
}

export async function printOrder(
  order: Order, 
  storeName: string = "Loja",
  options: PrintOrderOptions = {}
) {
  try {
    if (!options.preview) {
      toast.info('Preparando impressão...');
    }
    
    // Buscar configuração de impressão da loja
    const { data: configData, error: configError } = await supabase
      .from('print_configurations')
      .select('*')
      .eq('store_id', order.store_id)
      .eq('document_type', 'complete')
      .eq('is_active', true)
      .single();

    if (configError || !configData) {
      toast.error("Configuração de impressão não encontrada");
      return;
    }

    const config = configData as any as PrintConfig;

    // Buscar itens do pedido
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) {
      toast.error("Erro ao buscar itens do pedido");
      return;
    }

    // Buscar adicionais dos itens
    const { data: addons, error: addonsError } = await supabase
      .from('order_addons')
      .select('*')
      .in('order_item_id', items?.map(i => i.id) || []);

    // Determinar quais vias imprimir
    const viasToprint: string[] = [];
    if (config.print_copies?.complete) viasToprint.push('complete');
    if (config.print_copies?.kitchen) viasToprint.push('kitchen');
    if (config.print_copies?.delivery) viasToprint.push('delivery');

    // Se nenhuma via configurada, usar via completa como padrão
    if (viasToprint.length === 0) {
      viasToprint.push('complete');
    }

    // Se modo preview, retornar HTMLs individuais
    if (options.preview && options.onPreviewReady) {
      const htmlContents: string[] = [];
      const viaNames: string[] = [];
      
      viasToprint.forEach((via) => {
        htmlContents.push(generatePrintHTML(order, items || [], addons || [], config, storeName, via));
        viaNames.push(getDocumentTypeName(via));
      });
      
      options.onPreviewReady(htmlContents, viaNames);
      return;
    }

    // Gerar HTML combinado com todas as vias
    let combinedHTML = '';
    viasToprint.forEach((via, index) => {
      if (index > 0) {
        combinedHTML += getCutLineSeparator(config.print_type);
      }
      combinedHTML += generatePrintHTML(order, items || [], addons || [], config, storeName, via);
    });

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(combinedHTML);
      printWindow.document.close();
      printWindow.focus();
      
      toast.success('Impressão aberta! Finalize na janela de impressão.');
      
      // Aguardar carregamento e imprimir
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
    console.error('Erro ao imprimir pedido:', error);
    toast.error("Erro ao preparar impressão");
  }
}

export function executePrint(htmlContents: string[], printType: string = 'thermal_80mm') {
  try {
    let combinedHTML = '';
    htmlContents.forEach((html, index) => {
      if (index > 0) {
        combinedHTML += getCutLineSeparator(printType);
      }
      combinedHTML += html;
    });

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
    console.error('Erro ao executar impressão:', error);
    toast.error("Erro ao executar impressão");
  }
}

function generatePrintHTML(
  order: Order,
  items: OrderItem[],
  addons: OrderAddon[],
  config: PrintConfig,
  storeName: string,
  documentType: string = 'complete'
): string {
  const { styles, custom_texts } = config;
  
  // Adaptar seções baseado no tipo de via
  const sections = getAdaptedSections(documentType, config.sections);
  
  // Definir largura baseado no tipo de impressora
  let width = '100%';
  let maxWidth = '210mm'; // A4
  if (config.print_type === 'thermal_58mm') {
    maxWidth = '58mm';
  } else if (config.print_type === 'thermal_80mm') {
    maxWidth = '80mm';
  }

  // Tamanho da fonte
  const fontSizeMap = {
    small: '10px',
    medium: '12px',
    large: '14px'
  };
  const fontSize = fontSizeMap[styles.fontSize] || '12px';

  const separator = styles.showSeparators ? '<div style="border-top: 1px dashed #000; margin: 10px 0;"></div>' : '';
  const titleStyle = styles.boldTitles ? 'font-weight: bold;' : '';

  const hidePhone = shouldHideCustomerPhone(documentType);
  const viaName = getDocumentTypeName(documentType);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido #${order.order_number} - Via ${viaName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${styles.fontFamily}, monospace;
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
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item { margin: 5px 0; }
    .addon { margin-left: 15px; font-size: 90%; }
    .via-header { 
      text-align: center; 
      font-weight: bold; 
      font-size: 1.2em; 
      margin-bottom: 10px;
      padding: 5px;
      border: 2px solid #000;
      background: #f0f0f0;
      page-break-inside: avoid;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 10px;
    }
    .order-header {
      page-break-inside: avoid;
    }
    .order-info {
      page-break-inside: avoid;
    }
    .customer-info {
      page-break-inside: avoid;
    }
    .items-section {
      page-break-inside: avoid;
    }
    .totals-section {
      page-break-inside: avoid;
    }
    .payment-section {
      page-break-inside: avoid;
    }
    .footer-section {
      page-break-inside: avoid;
    }
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
  if (sections.header) {
    html += `
  <div class="section order-header text-${styles.headerAlign}" style="${titleStyle}">
    <h2>${storeName}</h2>
    ${custom_texts.headerText ? `<p>${custom_texts.headerText}</p>` : ''}
  </div>
  ${separator}
`;
  }

  // Order Info
  if (sections.orderInfo) {
    html += `
  <div class="section order-info" style="${titleStyle}">
    <p>Pedido: #${order.order_number}</p>
    <p>Data: ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
    <p>Tipo: ${order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}</p>
  </div>
  ${separator}
`;
  }

  // Customer Info
  if (sections.customerInfo) {
    const phoneDisplay = hidePhone ? '(Oculto para segurança)' : order.customer_phone;
    html += `
  <div class="section customer-info" style="${titleStyle}">
    <p><strong>Cliente:</strong> ${order.customer_name}</p>
    <p><strong>Telefone:</strong> ${phoneDisplay}</p>
    ${order.customer_address ? `<p><strong>Endereço:</strong> ${order.customer_address}</p>` : ''}
  </div>
  ${separator}
`;
  }

  // Items
  if (sections.items) {
    html += `<div class="section items-section">`;
    
    if (documentType === 'kitchen') {
      // Via Cozinha: SEM preços, foco na produção
      html += `
  <div style="text-align: center; font-size: 1.8em; font-weight: bold; margin: 15px 0; padding: 10px; border: 3px solid #000; page-break-inside: avoid;">
    PEDIDO #${order.order_number}
  </div>
  ${separator}
`;
      items.forEach(item => {
        html += `
  <div style="margin-bottom: 15px; page-break-inside: avoid;">
    <div style="font-size: 1.4em; font-weight: bold;">
      ${item.quantity}x ${item.product_name}
    </div>
`;
        
        // Adicionais
        const itemAddons = addons.filter(a => a.order_item_id === (item as any).id);
        if (itemAddons.length > 0) {
          itemAddons.forEach(addon => {
            html += `    <div style="margin-left: 15px; font-size: 1.2em;">+ ${addon.quantity}x ${addon.addon_name}</div>\n`;
          });
        }
        
        // Observações com destaque
        if (item.notes) {
          html += `    <div style="margin: 8px 0 0 15px; font-weight: bold; border-left: 4px solid #000; padding-left: 10px; font-size: 1.2em;">⚠️ OBS: ${item.notes}</div>\n`;
        }
        
        html += `  </div>\n`;
      });
      html += `${separator}`;
      
    } else if (documentType === 'delivery') {
      // Via Entregador: Endereço em destaque, itens simplificados
      if (order.customer_address) {
        html += `
  <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 10px; page-break-inside: avoid;">📍 ENDEREÇO DE ENTREGA</div>
  <div style="font-size: 1.2em; border: 3px solid #000; padding: 12px; margin-bottom: 15px; background: #f9f9f9; page-break-inside: avoid;">
    ${order.customer_address}
  </div>
  ${separator}
`;
      }
      
      html += `<div style="font-weight: bold; font-size: 1.2em; margin-bottom: 8px; page-break-inside: avoid;">Itens do Pedido:</div>`;
      items.forEach(item => {
        html += `  <div style="font-size: 1.1em; margin: 5px 0; page-break-inside: avoid;">${item.quantity}x ${item.product_name}</div>\n`;
      });
      html += `${separator}`;
      
    } else {
      // Via Completa: Formato com cálculo detalhado
      items.forEach(item => {
        const unitPrice = item.subtotal / item.quantity;
        html += `
  <div class="item" style="page-break-inside: avoid; margin-bottom: 8px;">
    <p style="font-weight: bold;">${item.quantity}x ${item.product_name}</p>
    <p style="margin-left: 20px; font-size: 95%;">R$ ${unitPrice.toFixed(2)} × ${item.quantity} = R$ ${item.subtotal.toFixed(2)}</p>
    ${item.notes ? `<p style="font-size: 90%; margin-left: 10px;">Obs: ${item.notes}</p>` : ''}
`;
        
        // Adicionais do item
        const itemAddons = addons.filter(a => a.order_item_id === (item as any).id);
        if (itemAddons.length > 0) {
          itemAddons.forEach(addon => {
            const addonUnitPrice = addon.subtotal / addon.quantity;
            html += `    <p class="addon" style="font-weight: bold;">+ ${addon.quantity}x ${addon.addon_name}</p>\n`;
            html += `    <p class="addon" style="margin-left: 40px; font-size: 90%;">R$ ${addonUnitPrice.toFixed(2)} × ${addon.quantity} = R$ ${addon.subtotal.toFixed(2)}</p>\n`;
          });
        }
        
        html += `  </div>\n`;
      });
      html += `${separator}`;
    }
    
    html += `</div>`;
  }

  // Totals
  if (sections.totals) {
    if (documentType === 'delivery') {
      // Via Entregador: Apenas total em destaque
      html += `
  <div class="section totals-section" style="font-size: 1.4em; font-weight: bold; text-align: center; margin: 15px 0; padding: 10px; border: 2px solid #000;">
    TOTAL A RECEBER: R$ ${order.total.toFixed(2)}
  </div>
  ${separator}
`;
    } else {
      // Via Completa: Detalhamento completo
      html += `
  <div class="section totals-section text-${styles.itemsAlign}" style="${titleStyle}">
    <p>Subtotal: R$ ${order.subtotal.toFixed(2)}</p>
    ${order.delivery_fee > 0 ? `<p>Taxa de Entrega: R$ ${order.delivery_fee.toFixed(2)}</p>` : ''}
    <p><strong>Total: R$ ${order.total.toFixed(2)}</strong></p>
  </div>
  ${separator}
`;
    }
  }

  // Payment
  if (sections.payment) {
    const paymentMethodMap: Record<string, string> = {
      'money': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX'
    };
    html += `
  <div class="section payment-section" style="${titleStyle}">
    <p><strong>Pagamento:</strong> ${paymentMethodMap[order.payment_method] || order.payment_method}</p>
    <p><strong>Status:</strong> ${order.payment_status === 'paid' ? 'Pago' : 'Pendente'}</p>
  </div>
  ${separator}
`;
  }

  // Footer
  if (sections.footer && custom_texts.footerText) {
    html += `
  <div class="section footer-section text-center">
    <p>${custom_texts.footerText}</p>
  </div>
`;
  }

  // Rodapé fixo Mostralo (sempre visível e não removível)
  html += `
  <div class="section footer-section" style="border-top: 2px solid #000; margin-top: 15px; padding-top: 10px;">
    <div class="text-center" style="font-size: 85%; color: #666;">
      <p style="margin: 3px 0;">Sistema de pedidos online</p>
      <p style="margin: 3px 0; font-weight: bold; color: #000;">MOSTRALO - www.mostralo.app</p>
    </div>
  </div>
`;

  html += `
</body>
</html>
`;

  return html;
}
