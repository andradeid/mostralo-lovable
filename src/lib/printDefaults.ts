// Layout padrão da impressão do pedido: o mesmo com que a tela de Configuração de Impressão abre.
// Usado quando a loja ainda não salvou uma configuração (Visualizar/Imprimir não ficam bloqueados).
export const DEFAULT_PRINT_CONFIG = {
  document_type: 'complete',
  print_type: 'thermal_80mm',
  sections: {
    header: true,
    orderInfo: true,
    customerInfo: true,
    items: true,
    totals: true,
    payment: true,
    footer: true,
  },
  styles: {
    fontSize: 'medium' as const,
    fontFamily: 'monospace',
    headerAlign: 'center' as const,
    itemsAlign: 'left' as const,
    boldTitles: true,
    showSeparators: true,
  },
  custom_texts: {
    headerText: '',
    footerText: '',
  },
  print_copies: {
    complete: true,
    kitchen: false,
    delivery: false,
  },
};
