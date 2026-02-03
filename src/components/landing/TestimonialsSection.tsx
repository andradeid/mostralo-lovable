import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendes',
    business: 'Hamburgueria Premium',
    savings: 'R$ 84.000/ano',
    revenue: 'R$ 28.000/mês',
    text: 'Saí do iFood há 6 meses. Economizei R$ 84 mil por ano e agora tenho controle total dos meus clientes. Melhor decisão que já tomei.'
  },
  {
    name: 'Juliana Santos',
    business: 'Pizzaria Bella Napoli',
    savings: 'R$ 54.000/ano',
    revenue: 'R$ 18.000/mês',
    text: 'Pagava 25% de taxa e não tinha acesso aos dados dos meus clientes. Agora tenho meu próprio sistema e economizo mais de R$ 4 mil por mês.'
  },
  {
    name: 'Ricardo Oliveira',
    business: 'Sushi Express',
    savings: 'R$ 96.000/ano',
    revenue: 'R$ 32.000/mês',
    text: 'A IA do WhatsApp sozinha já paga o sistema. Responde clientes automaticamente e processa pedidos. Nunca mais volto para marketplace.'
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="relative py-12 md:py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative container px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Resultados Reais
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Quem Saiu do iFood Não Se Arrepende
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja quanto nossos clientes estão economizando por ano
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {testimonial.savings}
                  </Badge>
                  <span className="text-sm text-muted-foreground">economizados</span>
                </div>
                <p className="text-sm text-muted-foreground">Faturamento: {testimonial.revenue}</p>
              </div>
              <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.business}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
