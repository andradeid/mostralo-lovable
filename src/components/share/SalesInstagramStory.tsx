import { Store } from 'lucide-react';
import { useQRCode } from '@/hooks/useQRCode';

interface SalesInstagramStoryProps {
  referralCode: string;
  signupLink: string;
  sellerName?: string;
}

export function SalesInstagramStory({
  referralCode,
  signupLink,
  sellerName
}: SalesInstagramStoryProps) {
  const qrDataUrl = useQRCode(signupLink, 280);

  return (
    <div 
      className="relative overflow-hidden flex flex-col items-center justify-between"
      style={{
        width: '1080px',
        height: '1920px',
        background: 'linear-gradient(180deg, #f97316 0%, #f59e0b 50%, #ea580c 100%)'
      }}
    >
      {/* Círculos decorativos */}
      <div 
        className="absolute rounded-full"
        style={{
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}
      />
      <div 
        className="absolute rounded-full"
        style={{
          bottom: '-300px',
          left: '-300px',
          width: '800px',
          height: '800px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}
      />
      <div 
        className="absolute rounded-full"
        style={{
          top: '40%',
          left: '-150px',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.08)'
        }}
      />

      {/* Topo - Logo */}
      <div className="relative z-10 pt-24 flex flex-col items-center">
        <div 
          className="rounded-2xl flex items-center justify-center shadow-2xl"
          style={{
            width: '160px',
            height: '160px',
            background: 'white'
          }}
        >
          <Store style={{ width: '100px', height: '100px', color: '#f97316' }} />
        </div>
        <p 
          className="text-center font-bold text-white mt-6"
          style={{ fontSize: '56px' }}
        >
          Mostralo
        </p>
      </div>

      {/* Título */}
      <div className="relative z-10 text-center px-12">
        <h1 
          className="font-bold text-white leading-tight"
          style={{ fontSize: '72px' }}
        >
          CANSADO DE<br />
          PAGAR<br />
          <span 
            className="block"
            style={{ 
              fontSize: '140px',
              textShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            25%
          </span>
          PRO IFOOD?
        </h1>
      </div>

      {/* QR Code */}
      <div className="relative z-10">
        <div 
          className="rounded-3xl shadow-2xl flex flex-col items-center"
          style={{
            background: 'white',
            padding: '40px'
          }}
        >
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" width={280} height={280} />}
          <p 
            className="font-bold text-gray-800 mt-4"
            style={{ fontSize: '32px' }}
          >
            ESCANEIE AQUI
          </p>
        </div>
      </div>

      {/* Benefícios */}
      <div className="relative z-10 flex flex-col gap-4 px-12">
        {[
          '🚫 0% de Taxa por Pedido',
          '📱 Marketing Digital Incluso',
          '💰 Economize até R$ 7.500/mês'
        ].map((benefit, index) => (
          <div 
            key={index}
            className="rounded-full text-center text-white font-semibold"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              padding: '20px 40px',
              fontSize: '36px'
            }}
          >
            {benefit}
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="relative z-10 pb-24 text-center">
        <div 
          className="rounded-2xl mb-6"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '20px 60px'
          }}
        >
          <p className="text-white opacity-70" style={{ fontSize: '28px' }}>
            Use o código
          </p>
          <p 
            className="font-mono font-bold text-white tracking-wider"
            style={{ fontSize: '56px' }}
          >
            {referralCode}
          </p>
        </div>
        
        {sellerName && (
          <p className="text-white opacity-80" style={{ fontSize: '32px' }}>
            Indicação: {sellerName}
          </p>
        )}
        
        <p 
          className="text-white opacity-60 mt-6 font-medium"
          style={{ fontSize: '36px' }}
        >
          👆 Arrasta pra cima!
        </p>
      </div>
    </div>
  );
}
