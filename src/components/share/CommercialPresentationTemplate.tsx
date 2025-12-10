import { Store } from 'lucide-react';

// Usar API gratuita para gerar QR Code
const getQrCodeUrl = (url: string, size: number) => 
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=svg`;

interface Plan {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  promotion_active?: boolean | null;
  is_popular?: boolean | null;
  features?: { text: string }[] | null;
}

interface CommercialPresentationTemplateProps {
  referralCode: string;
  homepageLink: string;
  signupLink: string;
  sellerName?: string;
  sellerPhone?: string;
  plans: Plan[];
}

export function CommercialPresentationTemplate({
  referralCode,
  homepageLink,
  signupLink,
  sellerName,
  sellerPhone,
  plans
}: CommercialPresentationTemplateProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'mostralo.com.br';

  // Dimensões A4 em pixels (96 DPI)
  const pageStyle = {
    width: '794px',
    height: '1123px',
    minWidth: '794px',
    minHeight: '1123px',
    maxWidth: '794px',
    maxHeight: '1123px',
  };

  return (
    <div style={{ background: 'white' }}>
      {/* PÁGINA 1 - FRENTE: Impacto + Problema */}
      <div 
        style={{
          ...pageStyle,
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #ea580c 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 40px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
        }} />
        
        {/* Header com Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              <Store style={{ width: '28px', height: '28px', color: '#f97316' }} />
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>Mostralo</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Delivery + Marketing Digital</p>
            <p style={{ fontSize: '11px', opacity: 0.6 }}>{currentDomain}</p>
          </div>
        </div>
        
        {/* Título Principal */}
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            lineHeight: 1.1,
          }}>
            PARE DE PAGAR <span style={{ fontSize: '48px' }}>25%</span> PARA O IFOOD!
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            Tenha seu próprio delivery e marketing digital
          </p>
        </div>
        
        {/* Bloco do Problema - Fundo Branco */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          color: '#111827',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 10,
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', textAlign: 'center' }}>
            Se você fatura <strong style={{ color: '#111827' }}>R$ 30.000/mês</strong> pelo iFood:
          </p>
          
          {/* Cálculo Visual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px' }}>Taxa iFood (25%)</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>- R$ 7.500</p>
              <p style={{ color: '#9ca3af', fontSize: '10px' }}>por mês</p>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px' }}>Por ANO</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#b91c1c' }}>- R$ 90.000</p>
              <p style={{ color: '#9ca3af', fontSize: '10px' }}>perdidos!</p>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px' }}>Mostralo</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>~R$ 7.200</p>
              <p style={{ color: '#9ca3af', fontSize: '10px' }}>por ano</p>
            </div>
          </div>
          
          {/* Comparativo Visual */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>iFood</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>R$ 90.000/ano</span>
              </div>
              <div style={{ height: '20px', background: '#ef4444', borderRadius: '6px', width: '100%' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>Mostralo</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>~R$ 7.200/ano</span>
              </div>
              <div style={{ height: '20px', background: 'linear-gradient(90deg, #f97316 0%, #f59e0b 100%)', borderRadius: '6px', width: '8%' }} />
            </div>
          </div>
          
          {/* Economia Destacada */}
          <div style={{ 
            background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)', 
            borderRadius: '10px', 
            padding: '16px',
            textAlign: 'center',
            color: 'white',
          }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
              💰 Economize até R$ 82.800/ano
            </p>
          </div>
        </div>
        
        {/* Diferenciais */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px', 
          marginTop: '20px',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>📱</p>
            <p style={{ fontSize: '11px', fontWeight: '600' }}>Cardápio Digital</p>
            <p style={{ fontSize: '9px', opacity: 0.8 }}>Seu próprio app</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>📈</p>
            <p style={{ fontSize: '11px', fontWeight: '600' }}>Marketing Digital</p>
            <p style={{ fontSize: '9px', opacity: 0.8 }}>Gestão de redes</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>💬</p>
            <p style={{ fontSize: '11px', fontWeight: '600' }}>WhatsApp</p>
            <p style={{ fontSize: '9px', opacity: 0.8 }}>Recupera clientes</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>0%</p>
            <p style={{ fontSize: '11px', fontWeight: '600' }}>Taxa por Pedido</p>
            <p style={{ fontSize: '9px', opacity: 0.8 }}>Lucro 100% seu</p>
          </div>
        </div>
        
        {/* Vendedor */}
        {sellerName && (
          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            position: 'relative',
            zIndex: 10,
          }}>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.7 }}>Apresentado por</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{sellerName}</p>
              {sellerPhone && <p style={{ fontSize: '14px', opacity: 0.8 }}>{sellerPhone}</p>}
            </div>
            <div style={{ background: 'white', padding: '8px', borderRadius: '8px' }}>
              <img src={getQrCodeUrl(homepageLink, 60)} alt="QR Code" width={60} height={60} />
            </div>
          </div>
        )}
        
        {/* Rodapé */}
        <div style={{ textAlign: 'center', marginTop: '16px', opacity: 0.6, fontSize: '11px', position: 'relative', zIndex: 10 }}>
          Frente • {currentDomain}
        </div>
      </div>

      {/* PÁGINA 2 - VERSO: Planos + CTA */}
      <div 
        style={{
          ...pageStyle,
          background: '#111827',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 40px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.1)',
        }} />
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Store style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Mostralo</span>
          </div>
          <p style={{ fontSize: '12px', opacity: 0.6 }}>Escolha seu plano</p>
        </div>
        
        {/* Planos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
          {plans.slice(0, 3).map((plan) => {
            const currentPrice = plan.promotion_active && plan.discount_price 
              ? plan.discount_price 
              : plan.price;
            const features = Array.isArray(plan.features) ? plan.features : [];
            
            return (
              <div 
                key={plan.id}
                style={{
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative',
                  background: plan.is_popular 
                    ? 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)' 
                    : 'rgba(255,255,255,0.05)',
                  border: plan.is_popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: plan.is_popular ? '0 8px 24px rgba(249, 115, 22, 0.3)' : 'none',
                }}
              >
                {plan.is_popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    color: '#ea580c',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}>
                    ⭐ MAIS ESCOLHIDO
                  </div>
                )}
                
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px', marginTop: plan.is_popular ? '8px' : '0' }}>
                  {plan.name}
                </h3>
                
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  {plan.promotion_active && plan.discount_price && (
                    <p style={{ fontSize: '11px', textDecoration: 'line-through', opacity: 0.6 }}>
                      {formatPrice(plan.price)}
                    </p>
                  )}
                  <p style={{ fontSize: '22px', fontWeight: 'bold' }}>{formatPrice(currentPrice)}</p>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>/mês</p>
                </div>
                
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                      <span style={{ lineHeight: 1.3 }}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        {/* Benefícios inclusos */}
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          borderRadius: '10px', 
          padding: '12px',
          textAlign: 'center',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 10,
        }}>
          <p style={{ fontSize: '11px', color: '#4ade80' }}>
            ✅ Todos os planos: Cardápio Digital • Marketing Digital • WhatsApp Marketing • 0% taxa
          </p>
        </div>
        
        {/* CTA com QR Codes */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          zIndex: 10,
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '20px',
          }}>
            Pronto para <span style={{ color: '#fb923c' }}>Economizar?</span>
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '20px' }}>
            {/* QR Ver Planos */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '10px', marginBottom: '8px' }}>
                <img src={getQrCodeUrl(homepageLink, 100)} alt="QR Code" width={100} height={100} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>Ver Planos</p>
              <p style={{ fontSize: '10px', opacity: 0.6 }}>Conheça os benefícios</p>
            </div>
            
            {/* QR Cadastre-se */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', 
                padding: '3px', 
                borderRadius: '10px',
                marginBottom: '8px',
              }}>
                <div style={{ background: 'white', padding: '7px', borderRadius: '8px' }}>
                  <img src={getQrCodeUrl(signupLink, 100)} alt="QR Code" width={100} height={100} />
                </div>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>Cadastre-se</p>
              <p style={{ fontSize: '10px', opacity: 0.6 }}>Comece agora</p>
            </div>
          </div>
          
          {/* Código de Referência */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '6px' }}>Use o código de indicação</p>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              display: 'inline-block',
              padding: '10px 24px', 
              borderRadius: '10px',
              border: '1px dashed rgba(255,255,255,0.3)',
            }}>
              <p style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>{referralCode}</p>
            </div>
          </div>
        </div>
        
        {/* Contato do vendedor */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 10,
        }}>
          <div>
            {sellerName && (
              <>
                <p style={{ fontSize: '11px', opacity: 0.6 }}>Fale comigo:</p>
                <p style={{ fontSize: '16px', fontWeight: '600' }}>{sellerName}</p>
                {sellerPhone && <p style={{ fontSize: '14px', opacity: 0.8 }}>{sellerPhone}</p>}
              </>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', opacity: 0.6 }}>Verso • {currentDomain}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
