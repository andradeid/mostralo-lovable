import { ReactNode } from 'react';
import { MousePointerClick } from 'lucide-react';

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  showInteractHint?: boolean;
}

export function PhoneMockup({ children, className = '', showInteractHint = true }: PhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Interact hint */}
      {showInteractHint && (
        <div className="absolute -top-3 -right-3 z-30 animate-bounce">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Interaja!</span>
          </div>
        </div>
      )}

      {/* Phone Frame - Wider */}
      <div className="relative mx-auto w-[340px] h-[640px] bg-zinc-900 rounded-[3rem] p-2 shadow-2xl shadow-black/50">
        {/* Inner bezel */}
        <div className="relative w-full h-full bg-zinc-800 rounded-[2.5rem] overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-900 rounded-b-2xl z-20 flex items-center justify-center">
            <div className="w-16 h-4 bg-zinc-800 rounded-full flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-zinc-600 rounded-full" />
              <div className="w-4 h-4 bg-zinc-700 rounded-full" />
            </div>
          </div>
          
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-[#008069] z-10 flex items-center justify-between px-6 text-white text-[10px]">
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-2.5 bg-white rounded-sm" />
                <div className="w-1 h-2.5 bg-white rounded-sm" />
                <div className="w-1 h-2.5 bg-white rounded-sm" />
                <div className="w-1 h-2.5 bg-white/50 rounded-sm" />
              </div>
              <span className="ml-1">5G</span>
              <div className="w-5 h-2.5 border border-white rounded-sm ml-1">
                <div className="w-3/4 h-full bg-white rounded-sm" />
              </div>
            </div>
          </div>

          {/* Screen Content - Fixed height to prevent jump */}
          <div className="absolute top-7 left-0 right-0 bottom-0 overflow-hidden">
            {children}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-20" />
        </div>
      </div>

      {/* Reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[3rem] pointer-events-none" />
      
      {/* Personalized attention badge */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-zinc-800/90 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full border border-zinc-700 flex items-center gap-2 shadow-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Atendimento Personalizado</span>
        </div>
      </div>
    </div>
  );
}
