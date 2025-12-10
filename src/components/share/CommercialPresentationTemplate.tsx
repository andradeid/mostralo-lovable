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

  return (
    <div className="bg-white">
      {/* Página 1 - Capa */}
      <div className="w-[210mm] h-[297mm] bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-white/5" />
        
        {/* Logo */}
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-20 h-20 rounded-xl shadow-lg bg-white flex items-center justify-center">
            <Store className="w-12 h-12" style={{ color: '#f97316' }} />
          </div>
          <span className="text-5xl font-bold text-white">Mostralo</span>
        </div>
        
        {/* Título Principal */}
        <h1 className="text-5xl font-bold text-center mb-6 relative z-10 leading-tight">
          PARE DE PAGAR<br />
          <span className="text-7xl">25%</span><br />
          PARA O IFOOD!
        </h1>
        
        {/* Subtítulo */}
        <p className="text-2xl text-center mb-12 opacity-90 relative z-10">
          Delivery + Marketing Digital<br />
          em uma só plataforma
        </p>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-2xl relative z-10">
          <img src={getQrCodeUrl(homepageLink, 120)} alt="QR Code" width={120} height={120} />
        </div>
        <p className="text-sm mt-4 opacity-80 relative z-10">Escaneie para conhecer</p>
        
        {/* Vendedor */}
        {sellerName && (
          <div className="absolute bottom-8 text-center relative z-10">
            <p className="text-lg opacity-90">Apresentado por</p>
            <p className="text-2xl font-bold">{sellerName}</p>
            {sellerPhone && <p className="text-lg opacity-80">{sellerPhone}</p>}
          </div>
        )}
      </div>

      {/* Página 2 - O Problema */}
      <div className="w-[210mm] h-[297mm] bg-white flex flex-col p-12 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-12 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <h2 className="text-4xl font-bold text-gray-900">O Custo Escondido do iFood</h2>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Cálculo Visual */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-700 mb-6">Se você fatura por mês:</p>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm mb-2">Faturamento</p>
                <p className="text-3xl font-bold text-gray-900">R$ 30.000</p>
              </div>
              <div className="bg-red-100 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-2">Taxa iFood (25%)</p>
                <p className="text-3xl font-bold text-red-600">- R$ 7.500</p>
              </div>
              <div className="bg-red-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-2">Por ANO</p>
                <p className="text-3xl font-bold text-red-700">- R$ 90.000</p>
              </div>
            </div>
          </div>
          
          {/* Comparativo */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <p className="text-xl font-semibold text-gray-700 mb-6">Comparativo Anual:</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">iFood</span>
                  <span className="font-bold text-red-600">R$ 90.000/ano</span>
                </div>
                <div className="h-8 bg-red-500 rounded-lg w-full" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Mostralo</span>
                  <span className="font-bold text-green-600">~R$ 7.200/ano</span>
                </div>
                <div className="h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg w-[8%]" />
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-2xl font-bold text-green-600">
                💰 Economia de até R$ 82.800/ano
              </p>
            </div>
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="text-center text-gray-400 text-sm">
          Página 2 de 4 • Mostralo
        </div>
      </div>

      {/* Página 3 - A Solução (Planos) */}
      <div className="w-[210mm] h-[297mm] bg-white flex flex-col p-12 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-12 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <h2 className="text-4xl font-bold text-gray-900">Nossos Planos</h2>
        </div>
        
        {/* Planos */}
        <div className="flex-1 flex items-center">
          <div className="grid grid-cols-3 gap-6 w-full">
            {plans.slice(0, 3).map((plan) => {
              const currentPrice = plan.promotion_active && plan.discount_price 
                ? plan.discount_price 
                : plan.price;
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <div 
                  key={plan.id}
                  className={`rounded-2xl p-6 relative ${
                    plan.is_popular 
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl scale-105' 
                      : 'bg-gray-50 text-gray-900 border-2 border-gray-200'
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-bold shadow">
                      ⭐ MAIS ESCOLHIDO
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-center mb-4">{plan.name}</h3>
                  
                  <div className="text-center mb-6">
                    {plan.promotion_active && plan.discount_price && (
                      <p className={`text-sm line-through ${plan.is_popular ? 'opacity-70' : 'text-gray-400'}`}>
                        {formatPrice(plan.price)}
                      </p>
                    )}
                    <p className="text-3xl font-bold">{formatPrice(currentPrice)}</p>
                    <p className={`text-sm ${plan.is_popular ? 'opacity-80' : 'text-gray-500'}`}>/mês</p>
                  </div>
                  
                  <ul className="space-y-2">
                    {features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-400">✓</span>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
          <p className="text-center text-green-800 font-semibold text-lg">
            ✅ Todos os planos incluem: Cardápio Digital • Gestão de Pedidos • Marketing Digital • 0% de taxa por pedido
          </p>
        </div>
        
        {/* Rodapé */}
        <div className="text-center text-gray-400 text-sm mt-4">
          Página 3 de 4 • Mostralo
        </div>
      </div>

      {/* Página 4 - Chamada para Ação */}
      <div className="w-[210mm] h-[297mm] bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full bg-orange-500/20" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-amber-500/10" />
        
        <h2 className="text-5xl font-bold text-center mb-4 relative z-10">
          Pronto para<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
            Economizar?
          </span>
        </h2>
        
        <p className="text-xl opacity-80 text-center mb-12 relative z-10">
          Escaneie o QR Code e comece hoje mesmo
        </p>
        
        {/* QR Codes */}
        <div className="flex gap-12 relative z-10">
          <div className="text-center">
            <div className="bg-white p-4 rounded-2xl shadow-2xl mb-4">
              <img src={getQrCodeUrl(homepageLink, 150)} alt="QR Code" width={150} height={150} />
            </div>
            <p className="text-lg font-medium">Ver Planos</p>
            <p className="text-sm opacity-60">Conheça os benefícios</p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-1 rounded-2xl shadow-2xl mb-4">
              <div className="bg-white p-3 rounded-xl">
                <img src={getQrCodeUrl(signupLink, 150)} alt="QR Code" width={150} height={150} />
              </div>
            </div>
            <p className="text-lg font-medium">Cadastre-se</p>
            <p className="text-sm opacity-60">Comece agora</p>
          </div>
        </div>
        
        {/* Código de referência */}
        <div className="mt-12 text-center relative z-10">
          <p className="text-sm opacity-60 mb-2">Use o código</p>
          <div className="bg-white/10 backdrop-blur px-8 py-3 rounded-xl">
            <p className="text-3xl font-mono font-bold tracking-wider">{referralCode}</p>
          </div>
        </div>
        
        {/* Contato do vendedor */}
        {(sellerName || sellerPhone) && (
          <div className="mt-8 text-center relative z-10">
            <p className="text-sm opacity-60">Fale comigo:</p>
            {sellerName && <p className="text-xl font-semibold">{sellerName}</p>}
            {sellerPhone && <p className="text-lg opacity-80">{sellerPhone}</p>}
          </div>
        )}
        
        {/* Rodapé */}
        <div className="absolute bottom-8 text-center w-full">
          <p className="text-sm opacity-40">
            Feito com ❤️ por Mostralo • mostralo.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
