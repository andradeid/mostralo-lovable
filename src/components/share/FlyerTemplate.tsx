import { Store } from 'lucide-react';

interface FlyerTemplateProps {
  referralCode: string;
  homepageLink: string;
  signupLink: string;
  sellerName?: string;
}

export function FlyerTemplate({ 
  referralCode, 
  homepageLink, 
  signupLink,
  sellerName 
}: FlyerTemplateProps) {
  const qrHomepage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(homepageLink)}&format=svg`;
  const qrSignup = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(signupLink)}&format=svg`;

  return (
    <div className="bg-white text-gray-900 p-8 w-[210mm] min-h-[297mm] mx-auto print:shadow-none shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-4">
          <Store className="w-12 h-12" style={{ color: '#f97316' }} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">MOSTRALO</h1>
        <p className="text-xl text-orange-600 font-semibold">
          Delivery + Marketing Digital
        </p>
      </div>

      {/* Main Message */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">
          PARE DE PAGAR 25% PARA O IFOOD!
        </h2>
        <p className="text-lg opacity-90">
          Tenha seu próprio app de delivery + marketing digital incluso
        </p>
      </div>

      {/* QR Codes */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="text-center">
          <div className="bg-gray-50 p-4 rounded-xl mb-3 inline-block">
            <img src={qrHomepage} alt="QR Página Inicial" width={180} height={180} />
          </div>
          <p className="font-bold text-lg">🏠 Ver Planos</p>
          <p className="text-sm text-gray-600">Conheça nossos benefícios</p>
        </div>
        <div className="text-center">
          <div className="bg-gray-50 p-4 rounded-xl mb-3 inline-block">
            <img src={qrSignup} alt="QR Cadastro" width={180} height={180} />
          </div>
          <p className="font-bold text-lg">📝 Cadastrar Agora</p>
          <p className="text-sm text-gray-600">Comece a economizar hoje</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-center">✨ O que você ganha:</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Cardápio Digital Completo
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Gestão de Pedidos
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Marketing Digital Incluso
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Sem Taxa por Pedido
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Relatórios Detalhados
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Suporte Humanizado
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="text-center border-t-2 border-dashed border-gray-300 pt-6">
        <p className="text-sm text-gray-600 mb-1">
          {sellerName ? `Indicado por: ${sellerName}` : 'Código de Referência:'}
        </p>
        <p className="text-2xl font-bold text-orange-600 tracking-wider">
          {referralCode}
        </p>
      </div>
    </div>
  );
}
