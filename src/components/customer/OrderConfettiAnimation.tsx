import { useEffect, useState } from 'react';

export const OrderConfettiAnimation = () => {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string }>>([]);

  useEffect(() => {
    // Gerar partículas aleatórias
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 w-3 h-3 animate-confetti"
          style={{
            left: particle.left,
            animationDelay: particle.delay,
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
              Math.floor(Math.random() * 5)
            ]
          }}
        />
      ))}
      
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
