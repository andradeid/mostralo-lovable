import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TEXT_DARK = "text-[#1A1A1A]";
const TEXT_MUTED = "text-[#666666]";

// Trecho único da página Barbearias V2: carrossel de depoimentos.

export const BarbeariaV2Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      name: "Ricardo Oliveira",
      role: "Dono da Barber Classic",
      image: "https://images.unsplash.com/photo-1581333100576-b73bbe79a05b?w=400&h=400&fit=crop",
      text: "O sistema mudou minha vida. Antes eu perdia horas no WhatsApp, hoje os clientes agendam sozinhos e eu recebo o sinal na hora."
    },
    {
      name: "Felipe Santos",
      role: "Mestre Barbeiro",
      image: "https://images.unsplash.com/photo-1503910361347-3c39aa7455a6?w=400&h=400&fit=crop",
      text: "A funcionalidade de clube de assinaturas é fantástica. Garantiu meu faturamento fixo todo mês e fidelizou meus melhores clientes."
    },
    {
      name: "Gustavo Mendes",
      role: "Rede Gold Barber",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      text: "Gerenciar 3 unidades era um caos. Com a Mostralo, tenho visão total de comissões e estoque em tempo real pelo celular."
    },
    {
      name: "André Cavalcante",
      role: "Barbearia do Imperador",
      image: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&h=400&fit=crop",
      text: "O suporte é nota 10. Sempre que precisei de ajuda para configurar o WhatsApp automático, fui atendido em minutos."
    },
    {
      name: "Lucas Ferreira",
      role: "The Gentleman Club",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
      text: "Reduzi meus cancelamentos em 80% usando os lembretes automáticos. Meus barbeiros estão muito mais satisfeitos com a agenda cheia."
    },
    {
      name: "Bruno Lima",
      role: "Barber & Beer",
      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop",
      text: "Implementar o sistema de checkout transparente aumentou minha taxa de conversão no site. O cliente não precisa sair da página para pagar."
    }
  ];

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
          <Badge className="bg-orange-50 text-orange-600 border-orange-100 px-4 py-2 font-bold mb-4">
            PROVA SOCIAL
          </Badge>
          <h2 className={cn("text-3xl md:text-5xl font-black tracking-tight", TEXT_DARK)}>
            Quem usa, <span className="text-[#FF5C00]">recomenda.</span>
          </h2>
          <p className={cn("text-lg font-medium", TEXT_MUTED)}>
            Veja o que barbeiros de todo o Brasil estão falando sobre a Mostralo.
          </p>
        </div>

        <div 
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, i) => (
                <div key={i} className="min-w-full px-4">
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white">
                    <CardContent className="p-8 md:p-12 space-y-6">
                      <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name} 
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-orange-100 shadow-lg"
                        />
                        <div className="space-y-2">
                          <div className="flex justify-center md:justify-start gap-1 mb-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-orange-400 text-orange-400" />)}
                          </div>
                          <h4 className={cn("font-bold text-xl md:text-2xl", TEXT_DARK)}>{testimonial.name}</h4>
                          <p className="text-sm md:text-base text-[#FF5C00] font-bold uppercase tracking-wider">{testimonial.role}</p>
                        </div>
                      </div>
                      <p className={cn("italic leading-relaxed text-lg md:text-xl text-center md:text-left", TEXT_MUTED)}>
                        "{testimonial.text}"
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-[#FF5C00] transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-[#FF5C00] transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Navigation Bullets */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  currentIndex === i ? "bg-[#FF5C00] w-8" : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Ir para depoimento ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">Depoimentos ilustrativos, para exemplo.</p>
        </div>
      </div>
    </section>
  );
};
