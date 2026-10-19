import { useEffect, useState } from 'react';

export function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    // Sem animação quando a aba não está visível (o navegador pausa a animação e o valor ficaria parado)
    if (typeof document !== 'undefined' && document.hidden) {
      setCount(end);
      return;
    }

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Centavos preservados e valor final exato
      setCount(percentage >= 1 ? end : Math.round(end * percentage * 100) / 100);
      
      if (percentage < 1) {
        requestAnimationFrame(step);
      }
    };
    
    const raf = requestAnimationFrame(step);
    // Garante o valor final mesmo se a animação for interrompida
    const done = setTimeout(() => setCount(end), duration + 200);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [end, duration]);

  return count;
}
