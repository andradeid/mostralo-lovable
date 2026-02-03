import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame */}
      <div className="relative mx-auto w-[280px] h-[580px] bg-zinc-900 rounded-[3rem] p-2 shadow-2xl shadow-black/50">
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

          {/* Screen Content */}
          <div className="absolute top-7 left-0 right-0 bottom-0 overflow-hidden">
            {children}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* Reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[3rem] pointer-events-none" />
    </div>
  );
}
