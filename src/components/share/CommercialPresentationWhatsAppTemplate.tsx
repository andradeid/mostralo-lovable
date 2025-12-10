import { Store, Download, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useQRCode } from '@/hooks/useQRCode';
interface Plan {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  promotion_active?: boolean | null;
  is_popular?: boolean | null;
  features?: { text: string }[] | null;
}

interface CommercialPresentationWhatsAppTemplateProps {
  referralCode: string;
  homepageLink: string;
  signupLink: string;
  sellerName?: string;
  sellerPhone?: string;
  plans: Plan[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

// Dimensões otimizadas para WhatsApp (1080x1080)
const imageStyle = {
  width: '540px',
  height: '540px',
  minWidth: '540px',
  minHeight: '540px',
  maxWidth: '540px',
  maxHeight: '540px',
};

// Imagem 1 - HOOK
function SlideHook() {
  return (
    <div style={{
      ...imageStyle,
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        left: '-40px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        <Store style={{ width: '48px', height: '48px', color: '#f97316' }} />
      </div>
      
      <h1 style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        textShadow: '0 4px 12px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>
        PARE DE PAGAR
      </h1>
      
      <h2 style={{ 
        fontSize: '72px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        textShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}>
        25%
      </h2>
      
      <p style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        PARA O IFOOD!
      </p>
      
      <p style={{ fontSize: '16px', opacity: 0.85, textAlign: 'center' }}>
        Seu dinheiro está indo para o lugar errado
      </p>
      
      <div style={{
        position: 'absolute',
        bottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: 0.7,
        fontSize: '14px',
      }}>
        <span>Mostralo</span>
        <span>•</span>
        <span>Delivery + Marketing Digital</span>
      </div>
    </div>
  );
}

// Imagem 2 - O PROBLEMA
function SlideProblem() {
  return (
    <div style={{
      ...imageStyle,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      color: '#111827',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Store style={{ width: '24px', height: '24px', color: 'white' }} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316' }}>Mostralo</span>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Se você fatura <span style={{ color: '#f97316' }}>R$ 30.000/mês</span>
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ 
          background: '#fef2f2', 
          borderRadius: '16px', 
          padding: '20px',
          border: '2px solid #fecaca',
        }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Taxa iFood (25%)</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>- R$ 7.500</p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>POR MÊS</p>
        </div>
        
        <div style={{ 
          background: '#fee2e2', 
          borderRadius: '16px', 
          padding: '20px',
          border: '2px solid #fca5a5',
        }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Isso significa por ANO:</p>
          <p style={{ fontSize: '42px', fontWeight: 'bold', color: '#b91c1c' }}>- R$ 90.000</p>
          <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '600' }}>💸 Dinheiro perdido!</p>
        </div>
      </div>
      
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '16px' }}>
        Deslize para ver a solução →
      </p>
    </div>
  );
}

// Imagem 3 - A SOLUÇÃO
function SlideSolution() {
  return (
    <div style={{
      ...imageStyle,
      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-80px',
        left: '-80px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>💰</p>
      
      <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '16px' }}>
        Com o Mostralo você
      </p>
      
      <h2 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        marginBottom: '32px',
        textAlign: 'center',
      }}>
        ECONOMIZA ATÉ
      </h2>
      
      <div style={{
        background: 'white',
        color: '#16a34a',
        padding: '24px 48px',
        borderRadius: '20px',
        marginBottom: '32px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        <p style={{ fontSize: '48px', fontWeight: 'bold' }}>R$ 82.800</p>
        <p style={{ fontSize: '18px', textAlign: 'center' }}>por ano</p>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ textDecoration: 'line-through', opacity: 0.7 }}>iFood</p>
          <p style={{ fontWeight: 'bold' }}>R$ 90.000</p>
        </div>
        <p style={{ fontSize: '24px' }}>→</p>
        <div style={{ textAlign: 'center' }}>
          <p style={{ opacity: 0.9 }}>Mostralo</p>
          <p style={{ fontWeight: 'bold' }}>~R$ 7.200</p>
        </div>
      </div>
      
      <p style={{ 
        position: 'absolute',
        bottom: '24px',
        fontSize: '16px',
        fontWeight: '600',
      }}>
        O lucro fica com VOCÊ! 🚀
      </p>
    </div>
  );
}

// Imagem 4 - DIFERENCIAIS
function SlideDifferentials() {
  return (
    <div style={{
      ...imageStyle,
      background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      color: 'white',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Store style={{ width: '24px', height: '24px', color: '#f97316' }} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Mostralo</span>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' }}>
        O que você ganha:
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.15)', 
          borderRadius: '16px', 
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '40px' }}>📱</span>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Cardápio Digital Próprio</p>
            <p style={{ fontSize: '14px', opacity: 0.85 }}>Seu app personalizado</p>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.15)', 
          borderRadius: '16px', 
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '40px' }}>📈</span>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Marketing Digital Incluso</p>
            <p style={{ fontSize: '14px', opacity: 0.85 }}>Gestão das suas redes sociais</p>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.15)', 
          borderRadius: '16px', 
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '40px', fontWeight: 'bold' }}>0%</span>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Taxa por Pedido</p>
            <p style={{ fontSize: '14px', opacity: 0.85 }}>Lucro 100% seu</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Imagem 5 - PLANOS
function SlidePlans({ plans }: { plans: Plan[] }) {
  return (
    <div style={{
      ...imageStyle,
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px',
      color: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Store style={{ width: '20px', height: '20px', color: 'white' }} />
        </div>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Nossos Planos</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {plans.slice(0, 3).map((plan) => {
          const currentPrice = plan.promotion_active && plan.discount_price 
            ? plan.discount_price 
            : plan.price;
          
          return (
            <div 
              key={plan.id}
              style={{
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: plan.is_popular 
                  ? 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)' 
                  : 'rgba(255,255,255,0.05)',
                border: plan.is_popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
              }}
            >
              {plan.is_popular && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '16px',
                  background: 'white',
                  color: '#ea580c',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}>
                  ⭐ POPULAR
                </div>
              )}
              
              <div>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{plan.name}</p>
                {plan.promotion_active && plan.discount_price && (
                  <p style={{ fontSize: '12px', textDecoration: 'line-through', opacity: 0.6 }}>
                    {formatPrice(plan.price)}
                  </p>
                )}
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatPrice(currentPrice)}</p>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>/mês</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ 
        background: 'rgba(34, 197, 94, 0.15)', 
        border: '1px solid rgba(34, 197, 94, 0.3)', 
        borderRadius: '12px', 
        padding: '12px',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        <p style={{ fontSize: '12px', color: '#4ade80' }}>
          ✅ Cardápio Digital • Marketing Digital • 0% taxa
        </p>
      </div>
    </div>
  );
}

// Imagem 6 - CTA
function SlideCTA({ 
  referralCode, 
  qrDataUrl, 
  sellerName, 
  sellerPhone 
}: { 
  referralCode: string; 
  qrDataUrl: string;
  sellerName?: string;
  sellerPhone?: string;
}) {
  return (
    <div style={{
      ...imageStyle,
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-100px',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        ACESSE AGORA E<br />COMECE A ECONOMIZAR!
      </h2>
      
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        borderRadius: '16px', 
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" width={160} height={160} />}
      </div>
      
      <p style={{ fontSize: '14px', opacity: 0.85, marginBottom: '16px' }}>
        Use o código de indicação
      </p>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.2)', 
        padding: '12px 32px', 
        borderRadius: '12px',
        border: '2px dashed rgba(255,255,255,0.4)',
        marginBottom: '24px',
      }}>
        <p style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>
          {referralCode}
        </p>
      </div>
      
      {sellerName && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Fale comigo:</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{sellerName}</p>
          {sellerPhone && <p style={{ fontSize: '16px', opacity: 0.9 }}>{sellerPhone}</p>}
        </div>
      )}
    </div>
  );
}

export function CommercialPresentationWhatsAppTemplate({
  referralCode,
  homepageLink,
  signupLink,
  sellerName,
  sellerPhone,
  plans
}: CommercialPresentationWhatsAppTemplateProps) {
  // QR Code como base64 para evitar tainted canvas
  const qrDataUrl = useQRCode(signupLink, 160);

  // Refs para captura em tamanho real (invisíveis)
  const captureRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  const slideNames = [
    'hook-pare-de-pagar',
    'problema-taxas',
    'solucao-economia',
    'diferenciais',
    'planos',
    'cta-cadastro',
  ];

  // Função auxiliar para converter imagens para base64
  const convertImagesToBase64 = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const conversionPromises = Array.from(images).map(async (img) => {
      if (img.src.startsWith('data:')) return; // Já é base64
      
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch {
        // Se falhar, manter imagem original
        console.warn('Failed to convert image to base64:', img.src);
      }
    });
    
    await Promise.all(conversionPromises);
  };

  // Função para capturar elemento como PNG usando canvas nativo
  const captureElementToPng = useCallback(async (element: HTMLElement): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas não suportado'));
          return;
        }

        // Clonar elemento
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.margin = '0';
        clone.style.padding = clone.style.padding || '40px';
        
        // ✅ Converter todas as imagens para base64 ANTES de serializar
        await convertImagesToBase64(clone);
        
        // Serializar para SVG foreignObject
        const serializer = new XMLSerializer();
        const htmlString = serializer.serializeToString(clone);
        
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="width:540px;height:540px;transform:scale(2);transform-origin:top left;">
                ${htmlString}
              </div>
            </foreignObject>
          </svg>
        `;
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1080, 1080);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          
          try {
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Falha ao carregar imagem'));
        };
        
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const viewSlide = useCallback(async (index: number) => {
    const ref = captureRefs[index];
    if (!ref.current) return;
    
    try {
      toast.loading('Gerando preview...', { id: `view-${index}` });
      
      // Gerar PNG real antes de abrir janela
      const dataUrl = await captureElementToPng(ref.current);
      
      // Abrir janela com IMAGEM REAL (tag <img>)
      const win = window.open('', '_blank', 'width=620,height=750');
      if (!win) {
        toast.dismiss(`view-${index}`);
        toast.error('Pop-up bloqueado. Permita pop-ups.');
        return;
      }
      
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Mostralo - ${slideNames[index]}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center;
                min-height: 100vh; 
                background: #1a1a1a; 
                padding: 20px;
                font-family: system-ui, sans-serif;
              }
              img { border-radius: 12px; max-width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
              .instructions {
                margin-top: 20px;
                text-align: center;
                color: #22c55e;
                font-size: 16px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Slide ${index + 1}" />
            <p class="instructions">✅ Clique direito na imagem → "Salvar imagem como..."</p>
          </body>
        </html>
      `);
      win.document.close();
      
      toast.dismiss(`view-${index}`);
      toast.success(`Imagem ${index + 1} pronta!`);
    } catch (error) {
      toast.dismiss(`view-${index}`);
      console.error('Erro:', error);
      toast.error('Erro ao gerar preview');
    }
  }, [slideNames, captureElementToPng]);

  const downloadSlide = useCallback(async (index: number) => {
    const ref = captureRefs[index];
    if (!ref.current) return;
    
    try {
      toast.loading('Gerando imagem...', { id: `download-${index}` });
      
      // Gerar PNG usando canvas nativo
      const dataUrl = await captureElementToPng(ref.current);
      
      // Download automático
      const link = document.createElement('a');
      link.download = `mostralo-whatsapp-${index + 1}-${slideNames[index]}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss(`download-${index}`);
      toast.success(`Imagem ${index + 1} baixada!`);
    } catch (error) {
      toast.dismiss(`download-${index}`);
      console.error('Erro:', error);
      toast.error('Erro ao baixar imagem');
    }
  }, [slideNames]);

  const downloadAll = async () => {
    toast.info('Baixando todas as imagens...');
    
    for (let i = 0; i < captureRefs.length; i++) {
      await downloadSlide(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success('Todas as imagens foram baixadas!');
  };

  const slides = [
    { title: '1. Impacto Inicial', component: <SlideHook /> },
    { title: '2. O Problema', component: <SlideProblem /> },
    { title: '3. A Solução', component: <SlideSolution /> },
    { title: '4. Diferenciais', component: <SlideDifferentials /> },
    { title: '5. Planos', component: <SlidePlans plans={plans} /> },
    { title: '6. Chamada para Ação', component: <SlideCTA referralCode={referralCode} qrDataUrl={qrDataUrl} sellerName={sellerName} sellerPhone={sellerPhone} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Botão Baixar Todas */}
      <div className="flex justify-center gap-4 no-print">
        <Button 
          onClick={downloadAll} 
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          <Download className="h-5 w-5 mr-2" />
          Baixar Todas (6 imagens)
        </Button>
      </div>

      {/* Elementos invisíveis para captura em tamanho real */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
        {slides.map((slide, index) => (
          <div key={`capture-${index}`} ref={captureRefs[index]}>
            {slide.component}
          </div>
        ))}
      </div>

      {/* Grid de Slides - Preview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {slides.map((slide, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground">{slide.title}</h3>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewSlide(index)}
                  className="no-print h-7 text-xs"
                  title="Visualizar (permite salvar com clique direito)"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadSlide(index)}
                  className="no-print h-7 text-xs"
                  title="Download automático PNG"
                >
                  <Download className="h-3 w-3 mr-1" />
                  PNG
                </Button>
              </div>
            </div>
            <div 
              className="rounded-lg overflow-hidden shadow-lg"
              style={{ 
                width: '270px', 
                height: '270px',
                position: 'relative',
              }}
            >
              <div style={{ 
                transform: 'scale(0.5)', 
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}>
                {slide.component}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dica */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3 no-print">
        <MessageSquare className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground mb-1">💡 Como usar no WhatsApp:</p>
          <p className="text-muted-foreground">
            Baixe as imagens e envie na ordem (1 a 6) como carrossel no WhatsApp. 
            Cada imagem tem uma mensagem única e impactante que guia o cliente até a ação.
          </p>
        </div>
      </div>
    </div>
  );
}