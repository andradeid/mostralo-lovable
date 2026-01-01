import { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#25D366', '#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F97316'];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
  delay: number;
}

export function ConfettiExplosion() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 200,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 0.3,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `translate(-50%, -50%)`,
            animation: `confetti-burst 1.2s ease-out ${particle.delay}s forwards`,
            '--confetti-x': `${particle.x}px`,
            '--confetti-y': `${particle.y}px`,
            '--confetti-rotation': `${particle.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}
      
      <style>{`
        @keyframes confetti-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(0) translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) 
                       translateX(var(--confetti-x)) 
                       translateY(calc(var(--confetti-y) + 150px)) 
                       rotate(var(--confetti-rotation)) 
                       scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}
