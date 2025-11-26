import { Card } from "@/components/ui/card";
import { PrintConfiguration } from "@/types/print";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PrintPreviewProps {
  config: Partial<PrintConfiguration>;
  storeName?: string;
}

function shouldHidePhone(documentType: string): boolean {
  return documentType === 'delivery';
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

function PreviewContent({
  config, 
  storeName, 
  documentType = 'complete' 
}: { 
  config: Partial<PrintConfiguration>; 
  storeName: string;
  documentType?: string;
}) {
  const { styles, custom_texts, print_type } = config;
  
  // Adaptar seções baseado no tipo de via
  const sections = getAdaptedSections(documentType || 'complete', config.sections);

  // Determinar largura baseado no tipo de impressão
  const width = print_type === 'thermal_58mm' ? '58mm' : 
                print_type === 'thermal_80mm' ? '80mm' : '210mm';
  
  const fontSize = styles?.fontSize === 'small' ? '10px' : 
                   styles?.fontSize === 'large' ? '14px' : '12px';

  const fontFamily = styles?.fontFamily === 'serif' ? 'serif' : 
                     styles?.fontFamily === 'sans-serif' ? 'sans-serif' : 'monospace';

  const Separator = () => styles?.showSeparators ? (
    <div className="border-b border-dashed border-border my-2" />
  ) : null;

  const Title = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontWeight: styles?.boldTitles ? 'bold' : 'normal' }}>{children}</div>
  );

  const hidePhone = shouldHidePhone(documentType);
  const phoneDisplay = hidePhone ? '(Oculto para segurança)' : '(11) 99999-9999';

  const viaNames: Record<string, string> = {
    'complete': 'COMPLETA',
    'kitchen': 'COZINHA',
    'delivery': 'ENTREGADOR'
  };

  return (
    <Card className="p-4 bg-background overflow-auto max-h-[calc(100vh-200px)]">
      <div 
        className="bg-white text-black p-4 mx-auto shadow-lg"
        style={{ 
          width,
          fontSize,
          fontFamily,
          minHeight: print_type === 'a4' ? '297mm' : 'auto'
        }}
      >
        {/* Cabeçalho da Via */}
        <div style={{ 
          textAlign: 'center', 
          fontWeight: 'bold', 
          fontSize: '1.2em', 
          marginBottom: '10px',
          padding: '5px',
          border: '2px solid black',
          background: '#f0f0f0'
        }}>
          ═══ VIA {viaNames[documentType] || documentType.toUpperCase()} ═══
        </div>
        <Separator />
        {/* Header */}
        {sections?.header && (
          <div style={{ textAlign: styles?.headerAlign }}>
            <Title>{storeName}</Title>
            {custom_texts?.headerText && (
              <div className="text-xs mt-1">{custom_texts.headerText}</div>
            )}
            <Separator />
          </div>
        )}

        {/* Order Info */}
        {sections?.orderInfo && (
          <div>
            <Title>Pedido #12345</Title>
            <div className="text-xs">Data: 04/11/2025 - 14:30</div>
            <div className="text-xs">Tipo: Delivery</div>
            <Separator />
          </div>
        )}

        {/* Customer Info */}
        {sections?.customerInfo && (
          <div>
            <Title>Cliente</Title>
            <div className="text-xs">Nome: João Silva</div>
            <div className="text-xs">Tel: {phoneDisplay}</div>
            <div className="text-xs">End: Rua Exemplo, 123 - Bairro</div>
            <Separator />
          </div>
        )}

        {/* Items */}
        {sections?.items && (
          <div>
            {documentType === 'kitchen' ? (
              // Via Cozinha: SEM preços, foco na produção
              <>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '1.8em', 
                  fontWeight: 'bold', 
                  margin: '15px 0',
                  padding: '10px',
                  border: '3px solid black'
                }}>
                  PEDIDO #12345
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <div style={{ fontSize: '1.4em', fontWeight: 'bold' }}>
                      2x Produto Exemplo
                    </div>
                    <div style={{ marginLeft: '15px', fontSize: '1.2em' }}>
                      + Adicional 1
                    </div>
                    <div style={{ 
                      margin: '8px 0 0 15px', 
                      fontWeight: 'bold', 
                      borderLeft: '4px solid black', 
                      paddingLeft: '10px',
                      fontSize: '1.2em'
                    }}>
                      ⚠️ OBS: Sem cebola
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4em', fontWeight: 'bold' }}>
                      1x Produto Teste
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            ) : documentType === 'delivery' ? (
              // Via Entregador: Endereço em destaque, itens simplificados
              <>
                <div style={{ fontWeight: 'bold', fontSize: '1.3em', marginBottom: '10px' }}>
                  📍 ENDEREÇO DE ENTREGA
                </div>
                <div style={{ 
                  fontSize: '1.2em', 
                  border: '3px solid black', 
                  padding: '12px', 
                  marginBottom: '15px',
                  background: '#f9f9f9'
                }}>
                  Rua Exemplo, 123 - Bairro Centro - Ref: Próximo ao mercado
                </div>
                <Separator />
                <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '8px' }}>
                  Itens do Pedido:
                </div>
                <div style={{ fontSize: '1.1em' }}>
                  <div className="my-1">2x Produto Exemplo</div>
                  <div className="my-1">1x Produto Teste</div>
                </div>
                <Separator />
              </>
            ) : (
              // Via Completa: Formato tradicional com preços
              <>
                <Title>Itens</Title>
                <div style={{ textAlign: styles?.itemsAlign }} className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>2x Produto Exemplo</span>
                      <span>R$ 50,00</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      • Adicional 1
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      Obs: Sem cebola
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>1x Produto Teste</span>
                      <span>R$ 25,00</span>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}
          </div>
        )}

        {/* Totals */}
        {sections?.totals && (
          <div>
            {documentType === 'delivery' ? (
              // Via Entregador: Apenas total em destaque
              <>
                <div style={{ 
                  fontSize: '1.4em', 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  margin: '15px 0',
                  padding: '10px',
                  border: '2px solid black'
                }}>
                  TOTAL A RECEBER: R$ 72,00
                </div>
                <Separator />
              </>
            ) : (
              // Via Completa: Detalhamento completo
              <>
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>R$ 75,00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Taxa de Entrega:</span>
                  <span>R$ 5,00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Desconto:</span>
                  <span>-R$ 8,00</span>
                </div>
                <div className={`flex justify-between ${styles?.boldTitles ? 'font-bold' : 'font-medium'} mt-1`}>
                  <span>Total:</span>
                  <span>R$ 72,00</span>
                </div>
                <Separator />
              </>
            )}
          </div>
        )}

        {/* Payment */}
        {sections?.payment && (
          <div>
            <Title>Pagamento</Title>
            <div className="text-xs">Forma: Dinheiro</div>
            <div className="text-xs">Troco para: R$ 100,00</div>
            <Separator />
          </div>
        )}

        {/* Footer */}
        {sections?.footer && custom_texts?.footerText && (
          <div style={{ textAlign: 'center' }} className="mt-4">
            <div className="text-xs">{custom_texts.footerText}</div>
          </div>
        )}

        {/* Rodapé fixo Mostralo (sempre visível e não removível) */}
        <div className="border-t-2 border-black mt-4 pt-3">
          <div style={{ textAlign: 'center' }} className="text-xs text-muted-foreground">
            <div className="mb-1">Sistema de pedidos online</div>
            <div className="font-bold text-black">MOSTRALO - www.mostralo.app</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PrintPreview({ config, storeName = "Minha Loja" }: PrintPreviewProps) {
  const selectedVias = [];
  if (config.print_copies?.complete) selectedVias.push({ key: 'complete', label: 'Via Completa' });
  if (config.print_copies?.kitchen) selectedVias.push({ key: 'kitchen', label: 'Via Cozinha' });
  if (config.print_copies?.delivery) selectedVias.push({ key: 'delivery', label: 'Via Entregador' });

  // Se nenhuma via selecionada, mostrar via completa como padrão
  if (selectedVias.length === 0) {
    selectedVias.push({ key: 'complete', label: 'Via Completa' });
  }

  // Se apenas uma via, mostrar direto sem tabs
  if (selectedVias.length === 1) {
    return <PreviewContent config={config} storeName={storeName} documentType={selectedVias[0].key} />;
  }

  // Se múltiplas vias, mostrar com tabs
  return (
    <Card className="p-4">
      <Tabs defaultValue={selectedVias[0].key}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedVias.length}, 1fr)` }}>
          {selectedVias.map(via => (
            <TabsTrigger key={via.key} value={via.key}>
              {via.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {selectedVias.map(via => (
          <TabsContent key={via.key} value={via.key}>
            <PreviewContent config={config} storeName={storeName} documentType={via.key} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
