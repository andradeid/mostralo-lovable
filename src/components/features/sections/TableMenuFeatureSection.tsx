import { QrCode, Smartphone, Users, ChefHat, Check, Clock, Zap, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { whatsappTexts } from '../data/sectionsData';

export function TableMenuFeatureSection() {
  const copyWhatsAppText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappTexts['cardapio-mesa']);
      toast.success('Texto copiado!');
    } catch {
      toast.error('Erro ao copiar texto');
    }
  };

  return (
    <section id="cardapio-mesa" className="py-16 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <QrCode className="h-6 w-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Cardápio na Mesa (QR Code)</h2>
              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">NOVO!</span>
              <button
                onClick={copyWhatsAppText}
                className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                title="Copiar texto para WhatsApp"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-muted-foreground">Cliente pede direto do celular, sem precisar chamar garçom</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'QR Code na Mesa', desc: 'Cliente escaneia e acessa cardápio no celular', icon: QrCode, color: 'text-purple-500' },
            { title: 'Sem App', desc: 'Funciona no navegador (PWA), não precisa baixar nada', icon: Smartphone, color: 'text-blue-500' },
            { title: 'Aprovação Opcional', desc: 'Configure se garçom precisa aprovar antes de ir para cozinha', icon: ChefHat, color: 'text-green-500' },
            { title: 'Atendimento Rápido', desc: 'Reduz 70% do tempo de atendimento', icon: Zap, color: 'text-yellow-500' },
          ].map((item, i) => (
            <Card key={i} className="bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <item.icon className={`h-8 w-8 ${item.color} mb-3`} />
                <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">70%</p>
              <p className="text-sm text-muted-foreground">Redução tempo atendimento</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">0</p>
              <p className="text-sm text-muted-foreground">Erros de anotação</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">+25%</p>
              <p className="text-sm text-muted-foreground">Rotatividade mesas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            'Senha de segurança por mesa',
            'Histórico de consumo em tempo real',
            'Divisão de conta automática',
            'Integração com KDS/Cozinha',
            'QR Codes personalizáveis',
            'Cliente acompanha pedido',
            'Funciona offline (PWA)',
            'Modo retirada no balcão'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
