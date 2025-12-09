interface MiniQRTemplateProps {
  referralCode: string;
  signupLink: string;
}

export function MiniQRTemplate({ referralCode, signupLink }: MiniQRTemplateProps) {
  const qrSignup = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(signupLink)}&format=svg`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center print:grid-cols-4">
      {/* Gerar 8 mini QR codes por página */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div 
          key={i}
          className="w-[50mm] h-[50mm] bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-center"
        >
          <div className="bg-white p-1 rounded">
            <img src={qrSignup} alt="QR Code" width={80} height={80} />
          </div>
          <p className="text-[10px] text-gray-600 mt-1 font-medium">
            Escaneie aqui ↑
          </p>
          <div className="mt-1 px-2 py-0.5 bg-orange-100 rounded">
            <span className="text-[9px] font-bold text-orange-600">{referralCode}</span>
          </div>
          <p className="text-[8px] text-gray-400 mt-1">mostralo.com.br</p>
        </div>
      ))}
    </div>
  );
}
