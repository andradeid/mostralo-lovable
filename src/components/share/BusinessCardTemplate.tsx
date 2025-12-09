interface BusinessCardTemplateProps {
  referralCode: string;
  signupLink: string;
  sellerName?: string;
  sellerPhone?: string;
}

export function BusinessCardTemplate({ 
  referralCode, 
  signupLink,
  sellerName,
  sellerPhone
}: BusinessCardTemplateProps) {
  const qrSignup = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(signupLink)}&format=svg`;

  return (
    <div className="flex flex-wrap gap-6 justify-center print:gap-4">
      {/* Gerar 4 cartões por página */}
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className="w-[85mm] h-[55mm] bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 flex shadow-lg print:shadow-none"
        >
          {/* Left side - Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold">
                  M
                </div>
                <span className="font-bold text-lg">MOSTRALO</span>
              </div>
              <p className="text-xs text-gray-400">
                Delivery + Marketing Digital
              </p>
            </div>
            
            <div className="mt-auto">
              {sellerName && (
                <p className="text-sm font-medium">{sellerName}</p>
              )}
              {sellerPhone && (
                <p className="text-xs text-gray-400">{sellerPhone}</p>
              )}
              <div className="mt-2 px-2 py-1 bg-orange-500/20 rounded inline-block">
                <span className="text-xs text-orange-400">Código: </span>
                <span className="font-bold text-orange-300">{referralCode}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - QR */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-2 rounded-lg">
              <img src={qrSignup} alt="QR Code" width={80} height={80} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              Escaneie para<br/>cadastrar
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
