import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  type: 'circle' | 'square' | 'diamond';
}

export const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const types: Array<'circle' | 'square' | 'diamond'> = ['circle', 'square', 'diamond'];
    const generatedParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 15 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.4 + 0.1,
      type: types[Math.floor(Math.random() * types.length)],
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`
            absolute bg-primary
            ${particle.type === 'circle' ? 'rounded-full' : ''}
            ${particle.type === 'square' ? 'rounded-sm' : ''}
            ${particle.type === 'diamond' ? 'rotate-45' : ''}
          `}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animation: `particleFloat ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            filter: particle.size > 4 ? 'blur(1px)' : 'none',
          }}
        />
      ))}
      
      {/* Large decorative blur orbs */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: '10%',
          left: '20%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          animation: 'orbFloat 20s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          bottom: '15%',
          right: '15%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
          animation: 'orbFloat 25s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          top: '50%',
          left: '60%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
          animation: 'orbFloat 18s ease-in-out 5s infinite',
        }}
      />
      
      {/* Connecting lines (subtle) */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0%" y1="30%" x2="100%" y2="70%" stroke="url(#lineGrad1)" strokeWidth="1" className="animate-line-draw" />
        <line x1="100%" y1="20%" x2="0%" y2="80%" stroke="url(#lineGrad1)" strokeWidth="1" className="animate-line-draw-reverse" />
      </svg>
      
      <style>{`
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: var(--opacity, 0.3);
          }
          20% {
            transform: translateY(-30px) translateX(15px) scale(1.1);
          }
          40% {
            transform: translateY(-15px) translateX(-20px) scale(0.9);
            opacity: calc(var(--opacity, 0.3) * 2);
          }
          60% {
            transform: translateY(-40px) translateX(10px) scale(1.2);
          }
          80% {
            transform: translateY(-20px) translateX(-15px) scale(1);
            opacity: var(--opacity, 0.3);
          }
        }

        @keyframes orbFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -20px) scale(1.05);
          }
          50% {
            transform: translate(-20px, 30px) scale(0.95);
          }
          75% {
            transform: translate(15px, 15px) scale(1.02);
          }
        }

        @keyframes line-draw {
          0% {
            stroke-dasharray: 0 1000;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 500 500;
          }
          100% {
            stroke-dasharray: 0 1000;
            stroke-dashoffset: -1000;
          }
        }

        .animate-line-draw {
          animation: line-draw 15s linear infinite;
        }

        .animate-line-draw-reverse {
          animation: line-draw 20s linear infinite reverse;
        }
      `}</style>
    </div>
  );
};
