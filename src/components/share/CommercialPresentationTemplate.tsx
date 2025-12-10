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
      {/* Página 1 - Capa */}
      <div 
        style={{
          ...pageStyle,
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #ea580c 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
        }} />
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <Store style={{ width: '48px', height: '48px', color: '#f97316' }} />
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>Mostralo</span>
        </div>
        
        {/* Título Principal */}
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '24px', 
          position: 'relative', 
          zIndex: 10,
          lineHeight: 1.2,
        }}>
          PARE DE PAGAR<br />
          <span style={{ fontSize: '72px' }}>25%</span><br />
          PARA O IFOOD!
        </h1>
        
        {/* Subtítulo */}
        <p style={{ fontSize: '24px', textAlign: 'center', marginBottom: '48px', opacity: 0.9, position: 'relative', zIndex: 10 }}>
          Delivery + Marketing Digital<br />
          em uma só plataforma
        </p>
        
        {/* QR Code */}
        <div style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 10,
        }}>
          <img src={getQrCodeUrl(homepageLink, 120)} alt="QR Code" width={120} height={120} />
        </div>
        <p style={{ fontSize: '14px', marginTop: '16px', opacity: 0.8, position: 'relative', zIndex: 10 }}>Escaneie para conhecer</p>
        
        {/* Vendedor */}
        {sellerName && (
          <div style={{ marginTop: '48px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontSize: '18px', opacity: 0.9 }}>Apresentado por</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{sellerName}</p>
            {sellerPhone && <p style={{ fontSize: '18px', opacity: 0.8 }}>{sellerPhone}</p>}
          </div>
        )}
      </div>

      {/* Página 2 - O Problema */}
      <div 
        style={{
          ...pageStyle,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            width: '6px', 
            height: '40px', 
            background: 'linear-gradient(180deg, #f97316 0%, #f59e0b 100%)', 
            borderRadius: '9999px',
          }} />
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>O Custo Escondido do iFood</h2>
        </div>
        
        {/* Conteúdo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Cálculo Visual */}
          <div style={{ 
            background: '#fef2f2', 
            border: '2px solid #fecaca', 
            borderRadius: '12px', 
            padding: '24px', 
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '18px', color: '#374151', marginBottom: '16px' }}>Se você fatura por mês:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div style={{ background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Faturamento</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>R$ 30.000</p>
              </div>
              <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '16px' }}>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Taxa iFood (25%)</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#dc2626' }}>- R$ 7.500</p>
              </div>
              <div style={{ background: '#fecaca', borderRadius: '10px', padding: '16px' }}>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Por ANO</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#b91c1c' }}>- R$ 90.000</p>
              </div>
            </div>
          </div>
          
          {/* Comparativo */}
          <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '32px' }}>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '24px' }}>Comparativo Anual:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>iFood</span>
                  <span style={{ fontWeight: 'bold', color: '#dc2626' }}>R$ 90.000/ano</span>
                </div>
                <div style={{ height: '32px', background: '#ef4444', borderRadius: '8px', width: '100%' }} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Mostralo</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>~R$ 7.200/ano</span>
                </div>
                <div style={{ height: '32px', background: 'linear-gradient(90deg, #f97316 0%, #f59e0b 100%)', borderRadius: '8px', width: '8%' }} />
              </div>
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                💰 Economia de até R$ 82.800/ano
              </p>
            </div>
          </div>
        </div>
        
        {/* Rodapé */}
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          Página 2 de 4 • Mostralo
        </div>
      </div>

      {/* Página 3 - A Solução (Planos) */}
      <div 
        style={{
          ...pageStyle,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            width: '6px', 
            height: '40px', 
            background: 'linear-gradient(180deg, #f97316 0%, #f59e0b 100%)', 
            borderRadius: '9999px',
          }} />
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Nossos Planos</h2>
        </div>
        
        {/* Planos */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%' }}>
            {plans.slice(0, 3).map((plan, index) => {
              const currentPrice = plan.promotion_active && plan.discount_price 
                ? plan.discount_price 
                : plan.price;
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <div 
                  key={plan.id}
                  style={{
                    borderRadius: '12px',
                    padding: '20px',
                    position: 'relative',
                    background: plan.is_popular 
                      ? 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)' 
                      : '#f9fafb',
                    color: plan.is_popular ? 'white' : '#111827',
                    border: plan.is_popular ? '2px solid #ea580c' : '2px solid #e5e7eb',
                    boxShadow: plan.is_popular ? '0 8px 24px rgba(249, 115, 22, 0.25)' : 'none',
                  }}
                >
                  {plan.is_popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      color: '#ea580c',
                      padding: '4px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      ⭐ MAIS ESCOLHIDO
                    </div>
                  )}
                  
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>{plan.name}</h3>
                  
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    {plan.promotion_active && plan.discount_price && (
                      <p style={{ 
                        fontSize: '14px', 
                        textDecoration: 'line-through', 
                        opacity: plan.is_popular ? 0.7 : 1,
                        color: plan.is_popular ? 'white' : '#9ca3af',
                      }}>
                        {formatPrice(plan.price)}
                      </p>
                    )}
                    <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatPrice(currentPrice)}</p>
                    <p style={{ fontSize: '14px', opacity: plan.is_popular ? 0.8 : 1, color: plan.is_popular ? 'white' : '#6b7280' }}>/mês</p>
                  </div>
                  
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                        <span style={{ color: '#4ade80' }}>✓</span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Benefícios extras */}
        <div style={{ 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '12px', 
          padding: '24px', 
          marginTop: '24px',
        }}>
          <p style={{ textAlign: 'center', color: '#166534', fontWeight: '600', fontSize: '16px' }}>
            ✅ Todos os planos incluem: Cardápio Digital • Gestão de Pedidos • Marketing Digital • 0% de taxa por pedido
          </p>
        </div>
        
        {/* Rodapé */}
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>
          Página 3 de 4 • Mostralo
        </div>
      </div>

      {/* Página 4 - Chamada para Ação */}
      <div 
        style={{
          ...pageStyle,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.2)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.1)',
        }} />
        
        <h2 style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
          Pronto para<br />
          <span style={{ 
            background: 'linear-gradient(90deg, #fb923c, #fbbf24)', 
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Economizar?
          </span>
        </h2>
        
        <p style={{ fontSize: '20px', opacity: 0.8, textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 10 }}>
          Escaneie o QR Code e comece hoje mesmo
        </p>
        
        {/* QR Codes */}
        <div style={{ display: 'flex', gap: '48px', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', marginBottom: '16px' }}>
              <img src={getQrCodeUrl(homepageLink, 150)} alt="QR Code" width={150} height={150} />
            </div>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>Ver Planos</p>
            <p style={{ fontSize: '14px', opacity: 0.6 }}>Conheça os benefícios</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', 
              padding: '4px', 
              borderRadius: '16px', 
              boxShadow: '0 20px 60px rgba(249, 115, 22, 0.4)', 
              marginBottom: '16px',
            }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px' }}>
                <img src={getQrCodeUrl(signupLink, 150)} alt="QR Code" width={150} height={150} />
              </div>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>Cadastre-se</p>
            <p style={{ fontSize: '14px', opacity: 0.6 }}>Comece agora</p>
          </div>
        </div>
        
        {/* Código de referência */}
        <div style={{ marginTop: '48px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Use o código</p>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 32px', borderRadius: '12px' }}>
            <p style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>{referralCode}</p>
          </div>
        </div>
        
        {/* Contato do vendedor */}
        {(sellerName || sellerPhone) && (
          <div style={{ marginTop: '32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontSize: '14px', opacity: 0.6 }}>Fale comigo:</p>
            {sellerName && <p style={{ fontSize: '20px', fontWeight: '600' }}>{sellerName}</p>}
            {sellerPhone && <p style={{ fontSize: '18px', opacity: 0.8 }}>{sellerPhone}</p>}
          </div>
        )}
        
        {/* Rodapé */}
        <div style={{ position: 'absolute', bottom: '32px', textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '14px', opacity: 0.4 }}>
            Feito com ❤️ por Mostralo • mostralo.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
