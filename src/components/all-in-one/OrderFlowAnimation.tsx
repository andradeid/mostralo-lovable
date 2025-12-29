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
  const [activeNode, setActiveNode] = useState(0);
  const [showPacket, setShowPacket] = useState(false);
  const [packetPosition, setPacketPosition] = useState(0);

  useEffect(() => {
    // Animate the packet flowing through the system
    const interval = setInterval(() => {
      setShowPacket(true);
      setPacketPosition(0);
      
      // Animate packet through each node
      const animatePacket = async () => {
        for (let i = 0; i <= 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 600));
          setActiveNode(i);
          setPacketPosition(i);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        setShowPacket(false);
        setActiveNode(-1);
      };
      
      animatePacket();
    }, 4000);

    // Initial animation
    setTimeout(() => {
      setShowPacket(true);
      let i = 0;
      const animateFirst = setInterval(() => {
        setActiveNode(i);
        setPacketPosition(i);
        i++;
        if (i > 3) {
          clearInterval(animateFirst);
          setTimeout(() => {
            setShowPacket(false);
            setActiveNode(-1);
          }, 800);
        }
      }, 600);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Main flow container */}
      <div className="flex items-center justify-between relative">
        {/* SVG Path with animated trail */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="3"
            strokeDasharray="8 8"
          />
          
          {/* Animated trail path */}
          {showPacket && (
            <path
              d="M 80 60 L 280 60 L 480 60 L 680 60"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              filter="url(#glow)"
              className="animate-dash"
              style={{
                strokeDasharray: '200',
                strokeDashoffset: 800 - (packetPosition * 200),
                transition: 'stroke-dashoffset 0.5s ease-out',
              }}
            />
          )}
        </svg>

        {/* Flow nodes */}
        {flowNodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = index === activeNode;
          
          return (
            <div key={node.id} className="relative z-10 flex flex-col items-center">
              {/* Node circle */}
              <div
                className={`
                  w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-primary shadow-[0_0_40px_rgba(var(--primary),0.6)] scale-110' 
                    : 'bg-secondary/80 border border-primary/30'
                  }
                `}
              >
                <Icon 
                  className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 ${
                    isActive ? 'text-primary-foreground' : 'text-primary'
                  }`} 
                />
                
                {/* Pulse ring on active */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-pulse" />
                  </>
                )}
              </div>
              
              {/* Labels */}
              <div className="mt-3 text-center">
                <p className={`font-display font-bold text-sm md:text-base transition-colors ${
                  isActive ? 'text-primary' : 'text-foreground'
                }`}>
                  {node.label}
                </p>
                <p className="text-muted-foreground text-xs md:text-sm">{node.sublabel}</p>
              </div>
              
              {/* Connection arrow (except last) */}
              {index < flowNodes.length - 1 && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-8 md:w-16 flex items-center justify-center -ml-4 md:-ml-8">
                  <Zap 
                    className={`w-4 h-4 transition-all duration-300 ${
                      showPacket && packetPosition >= index 
                        ? 'text-primary scale-125' 
                        : 'text-muted-foreground/30'
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
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-500 ease-out"
          style={{
            left: `calc(${12 + packetPosition * 25}% + 40px)`,
          }}
        >
          <div className="w-6 h-6 bg-primary rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.8)] flex items-center justify-center animate-bounce">
            <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          <span className="text-primary font-semibold">Sincronização em milissegundos</span> — 
          Do pedido no Totem até a notificação de "pronto" para o cliente, 
          tudo acontece em tempo real.
        </p>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-dash {
          animation: dash 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
