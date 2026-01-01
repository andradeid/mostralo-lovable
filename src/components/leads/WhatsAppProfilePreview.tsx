import { User, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppProfilePreviewProps {
  profilePicture: string | null;
  pushName: string | null;
  formattedNumber: string | null;
  formName: string;
  isPrivatePhoto?: boolean;
  className?: string;
}

const formatPhoneDisplay = (number: string | null | undefined): string => {
  if (!number) return '';
  
  const clean = number.replace(/\D/g, '');
  if (clean.length >= 12) {
    const country = clean.slice(0, 2);
    const ddd = clean.slice(2, 4);
    const part1 = clean.slice(4, 9);
    const part2 = clean.slice(9);
    return `+${country} ${ddd} ${part1}-${part2}`;
  }
  return `+${clean}`;
};

export function WhatsAppProfilePreview({
  profilePicture,
  pushName,
  formattedNumber,
  formName,
  isPrivatePhoto = false,
  className
}: WhatsAppProfilePreviewProps) {
  const displayName = pushName || formName;
  const hasNameDifference = pushName && pushName !== formName && pushName.toLowerCase() !== formName.toLowerCase();

  return (
    <div className={cn(
      "p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 animate-fade-in",
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "w-14 h-14 rounded-full overflow-hidden border-2 border-[#25D366] transition-all duration-500",
            profilePicture && "animate-scale-in"
          )}>
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                {isPrivatePhoto ? (
                  <Lock className="w-5 h-5 text-white/80" />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
            )}
          </div>
          
          {/* Badge de verificado */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {displayName}
          </p>
          {formattedNumber && (
            <p className="text-sm text-muted-foreground">
              {formatPhoneDisplay(formattedNumber)}
            </p>
          )}
          <p className="text-xs text-[#25D366] flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            WhatsApp verificado!
          </p>
        </div>
      </div>
      
      {/* Info adicional */}
      {(hasNameDifference || isPrivatePhoto) && (
        <div className="mt-3 pt-3 border-t border-[#25D366]/20 space-y-1">
          {hasNameDifference && (
            <p className="text-xs text-muted-foreground">
              💡 Nome no WhatsApp: <span className="font-medium">{pushName}</span>
            </p>
          )}
          {isPrivatePhoto && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Foto de perfil privada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
