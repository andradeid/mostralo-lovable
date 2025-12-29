import { useEffect, useState } from 'react';
import { Smartphone, Cloud, MonitorPlay, User, Zap } from 'lucide-react';

interface FlowNode {
  id: string;
  icon: typeof Smartphone;
  label: string;
  sublabel: string;
}

const flowNodes: FlowNode[] = [
  { id: 'totem', icon: Smartphone, label: 'TOTEM', sublabel: 'Autoatendimento' },
  { id: 'cloud', icon: Cloud, label: 'NUVEM', sublabel: 'Sincronização' },
  { id: 'kds', icon: MonitorPlay, label: 'KDS', sublabel: 'Cozinha' },
  { id: 'cliente', icon: User, label: 'CLIENTE', sublabel: 'Entrega' },
];

export const OrderFlowAnimation = () => {
  const [activeNode, setActiveNode] = useState(-1);
  const [showPacket, setShowPacket] = useState(false);
  const [packetPosition, setPacketPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initial animation after mount
    const startAnimation = () => {
      setShowPacket(true);
      setIsAnimating(true);
      
      let currentNode = 0;
      const animateNodes = setInterval(() => {
        setActiveNode(currentNode);
        setPacketPosition(currentNode);
        currentNode++;
        
        if (currentNode > 3) {
          clearInterval(animateNodes);
          setTimeout(() => {
            setActiveNode(-1);
            setShowPacket(false);
            setIsAnimating(false);
          }, 800);
        }
      }, 700);
    };

    // Start first animation
    const initialDelay = setTimeout(startAnimation, 800);

    // Set up repeating animation
    const repeatInterval = setInterval(() => {
      if (!isAnimating) {
        startAnimation();
      }
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(repeatInterval);
    };
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Animated background glow */}
      <div 
        className="absolute inset-0 rounded-3xl transition-all duration-700"
        style={{
          background: activeNode >= 0 
            ? `radial-gradient(circle at ${20 + activeNode * 25}% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)`
            : 'transparent',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-particle"
            style={{
              left: `${15 + i * 10}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 2)}s`,
            }}
          />
        ))}
      </div>

      {/* Main flow container */}
      <div className="flex items-center justify-between relative">
        {/* SVG Path with animated trail */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background path */}
          <path
            d="M 80 60 L 280 60 L 480 60 L 680 60"
            fill="none"
            stroke="hsl(var(--primary) / 0.15)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Animated energy trail */}
          <path
            d="M 80 60 L 280 60 L 480 60 L 680 60"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="4"
            filter="url(#glow)"
            className="animate-trail"
            strokeLinecap="round"
          />

          {/* Energy pulses */}
          {showPacket && [0, 1, 2].map((i) => (
            <circle
              key={i}
              r="3"
              fill="hsl(var(--primary))"
              filter="url(#glow)"
              className="animate-energy-dot"
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <animateMotion
                dur="2.4s"
                repeatCount="indefinite"
                begin={`${i * 0.8}s`}
              >
                <mpath href="#energyPath" />
              </animateMotion>
            </circle>
          ))}
          <path id="energyPath" d="M 80 60 L 280 60 L 480 60 L 680 60" fill="none" />
        </svg>

        {/* Flow nodes */}
        {flowNodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = index === activeNode;
          const isPassed = activeNode >= 0 && index < activeNode;
          
          return (
            <div 
              key={node.id} 
              className="relative z-10 flex flex-col items-center animate-node-entry"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Node circle */}
              <div
                className={`
                  relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center
                  transition-all duration-500 ease-out transform
                  ${isActive 
                    ? 'bg-primary shadow-[0_0_50px_rgba(var(--primary),0.7)] scale-110' 
                    : isPassed
                      ? 'bg-primary/40 border border-primary/60'
                      : 'bg-secondary/80 border border-primary/20 hover:border-primary/40'
                  }
                `}
              >
                <Icon 
                  className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-300 ${
                    isActive ? 'text-primary-foreground scale-110' : isPassed ? 'text-primary' : 'text-primary/70'
                  }`} 
                />
                
                {/* Pulse rings on active */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-primary/40 animate-ping-slow" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary/60 animate-pulse" />
                  </>
                )}

                {/* Glow effect */}
                {(isActive || isPassed) && (
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
                )}
              </div>
              
              {/* Labels */}
              <div className="mt-3 text-center">
                <p className={`font-display font-bold text-sm md:text-base transition-all duration-300 ${
                  isActive ? 'text-primary scale-105' : isPassed ? 'text-primary/80' : 'text-foreground'
                }`}>
                  {node.label}
                </p>
                <p className="text-muted-foreground text-xs md:text-sm">{node.sublabel}</p>
              </div>
              
              {/* Connection indicator */}
              {index < flowNodes.length - 1 && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-8 md:w-16 flex items-center justify-center -ml-4 md:-ml-8">
                  <Zap 
                    className={`w-4 h-4 transition-all duration-500 ${
                      isPassed || isActive
                        ? 'text-primary scale-125 animate-pulse' 
                        : 'text-muted-foreground/20'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Floating data packet */}
      {showPacket && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-600 ease-out"
          style={{
            left: `calc(${12 + packetPosition * 25}% + 40px)`,
          }}
        >
          <div className="relative animate-float">
            {/* Glow */}
            <div className="absolute inset-0 w-8 h-8 bg-primary rounded-xl blur-xl opacity-80" />
            
            {/* Packet */}
            <div className="relative w-8 h-8 bg-primary rounded-xl shadow-[0_0_30px_rgba(var(--primary),0.9)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>

            {/* Trail particles */}
            <div className="absolute top-1/2 right-full -translate-y-1/2 flex gap-1 mr-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-trail-dot"
                  style={{
                    opacity: 0.8 - i * 0.25,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-full">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <p className="text-muted-foreground text-sm md:text-base">
            <span className="text-primary font-semibold">Sincronização em milissegundos</span> — 
            Do pedido até a entrega
          </p>
        </div>
      </div>

      <style>{`
        @keyframes trail {
          0% { stroke-dasharray: 60 540; stroke-dashoffset: 600; }
          100% { stroke-dasharray: 60 540; stroke-dashoffset: 0; }
        }
        .animate-trail {
          animation: trail 3s linear infinite;
        }

        @keyframes particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.8; }
        }
        .animate-particle {
          animation: particle 4s ease-in-out infinite;
        }

        @keyframes node-entry {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-node-entry {
          animation: node-entry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 1s ease-in-out infinite;
        }

        @keyframes trail-dot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        .animate-trail-dot {
          animation: trail-dot 0.6s ease-in-out infinite;
        }

        @keyframes energy-dot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-energy-dot {
          animation: energy-dot 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
