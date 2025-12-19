import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  MessageCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Cpu, 
  HardDrive, 
  MemoryStick,
  Globe,
  Wifi,
  Star,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DiagnosticResult } from '@/hooks/usePerformanceDiagnostics';

interface VpsRecommendationsCardProps {
  currentMetrics?: DiagnosticResult | null;
  isLoading?: boolean;
}

interface VpsTier {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  capacity: string;
  cpu: string;
  ram: string;
  storage: string;
  bandwidth: string;
  price: string;
  services: string[];
}

const mainAppTiers: VpsTier[] = [
  {
    name: 'Básica',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    capacity: '1-2 lojas',
    cpu: '2 vCPU',
    ram: '4GB RAM',
    storage: '80GB SSD',
    bandwidth: '1TB Banda',
    price: '€6-12/mês',
    services: ['Nginx', 'Node.js/Deno', 'PostgreSQL', 'Certbot']
  },
  {
    name: 'Recomendada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    capacity: '3-10 lojas',
    cpu: '4 vCPU',
    ram: '8GB RAM',
    storage: '200GB NVMe',
    bandwidth: '5TB Banda',
    price: '€12-25/mês',
    services: ['Nginx', 'Node.js/Deno', 'PostgreSQL', 'Redis', 'Backup']
  },
  {
    name: 'Premium',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    capacity: '10+ lojas',
    cpu: '8+ vCPU',
    ram: '16GB+ RAM',
    storage: '400GB+ NVMe',
    bandwidth: '10TB+ Banda',
    price: '€40-80/mês',
    services: ['Nginx', 'Node.js/Deno', 'PostgreSQL', 'Redis', 'Backup', 'CDN', 'Monitoramento']
  }
];

const evolutionTiers: VpsTier[] = [
  {
    name: 'Básica',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    capacity: '1-5 instâncias',
    cpu: '2 vCPU',
    ram: '4GB RAM',
    storage: '50GB SSD',
    bandwidth: '1TB Banda',
    price: 'R$30-50/mês',
    services: ['Evolution API', 'MongoDB/PostgreSQL']
  },
  {
    name: 'Recomendada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    capacity: '5-20 instâncias',
    cpu: '4 vCPU',
    ram: '8GB RAM',
    storage: '100GB SSD',
    bandwidth: '3TB Banda',
    price: 'R$80-120/mês',
    services: ['Evolution API', 'MongoDB/PostgreSQL', 'Typebot']
  },
  {
    name: 'Premium',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    capacity: '20+ instâncias',
    cpu: '6+ vCPU',
    ram: '12GB+ RAM',
    storage: '200GB+ NVMe',
    bandwidth: '5TB+ Banda',
    price: 'R$150-250/mês',
    services: ['Evolution API', 'MongoDB/PostgreSQL', 'Typebot', 'N8N', 'Backup']
  }
];

interface Provider {
  name: string;
  highlight: string;
  idealFor: string;
  url: string;
  featured?: boolean;
}

const internationalProviders: Provider[] = [
  { name: 'Contabo', highlight: 'Melhor preço/especificação', idealFor: 'App principal', url: 'https://contabo.com', featured: true },
  { name: 'Hetzner', highlight: 'Excelente na Europa', idealFor: 'App principal', url: 'https://hetzner.com' },
  { name: 'Vultr', highlight: 'Datacenters globais', idealFor: 'Ambos', url: 'https://vultr.com' },
  { name: 'DigitalOcean', highlight: 'Fácil gerenciamento', idealFor: 'Iniciantes', url: 'https://digitalocean.com' },
  { name: 'OVH', highlight: 'Europeu, bom para LGPD', idealFor: 'Compliance', url: 'https://ovhcloud.com' },
  { name: 'Linode', highlight: 'Confiável, bom desempenho', idealFor: 'Ambos', url: 'https://linode.com' }
];

const brazilProviders: Provider[] = [
  { name: 'Hostinger', highlight: 'Datacenter no Brasil, bom preço', idealFor: 'Evolution API', url: 'https://hostinger.com.br', featured: true },
  { name: 'Locaweb', highlight: 'Empresa brasileira', idealFor: 'LGPD crítica', url: 'https://locaweb.com.br' },
  { name: 'KingHost', highlight: 'Suporte em português', idealFor: 'Suporte local', url: 'https://kinghost.com.br' }
];

function VpsTierCard({ tier, type }: { tier: VpsTier; type: 'main' | 'evolution' }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copySpecs = () => {
    const specs = `${tier.name} (${type === 'main' ? 'App Principal' : 'Evolution API'})
Capacidade: ${tier.capacity}
CPU: ${tier.cpu}
RAM: ${tier.ram}
Storage: ${tier.storage}
Bandwidth: ${tier.bandwidth}
Preço: ${tier.price}
Serviços: ${tier.services.join(', ')}`;

    navigator.clipboard.writeText(specs);
    setCopied(true);
    toast({ title: 'Especificações copiadas!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`${tier.borderColor} border-2 ${tier.bgColor} relative overflow-hidden`}>
      {tier.name === 'Recomendada' && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
          Popular
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg ${tier.color}`}>{tier.name}</CardTitle>
          <Button variant="ghost" size="icon" onClick={copySpecs} className="h-8 w-8">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="font-medium">{tier.capacity}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>{tier.cpu}</span>
          </div>
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <span>{tier.ram}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{tier.storage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span>{tier.bandwidth}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-2xl font-bold">{tier.price}</p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Serviços típicos:</p>
          <div className="flex flex-wrap gap-1">
            {tier.services.map((service) => (
              <Badge key={service} variant="secondary" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <a
      href={provider.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
    >
      <div className="flex items-center gap-3">
        {provider.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        <div>
          <p className="font-medium flex items-center gap-2">
            {provider.name}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
          <p className="text-xs text-muted-foreground">{provider.highlight}</p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {provider.idealFor}
      </Badge>
    </a>
  );
}

function ArchitectureDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Arquitetura Distribuída Atual
        </CardTitle>
        <CardDescription>Configuração recomendada para melhor desempenho</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
          {/* Contabo Box */}
          <div className="flex flex-col items-center p-4 bg-background rounded-lg border-2 border-blue-500/30 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-blue-600">Contabo</span>
            </div>
            <div className="text-center space-y-1 text-sm">
              <p className="font-medium">App Mostralo</p>
              <div className="flex flex-wrap justify-center gap-1">
                <Badge variant="secondary" className="text-xs">Frontend</Badge>
                <Badge variant="secondary" className="text-xs">API</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">+ Supabase (Cloud)</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-6 w-6 hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />
            <span className="text-xs">API Calls</span>
            <ArrowRight className="h-6 w-6 hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />
          </div>

          {/* Hostinger Box */}
          <div className="flex flex-col items-center p-4 bg-background rounded-lg border-2 border-green-500/30 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="font-bold text-green-600">Hostinger</span>
            </div>
            <div className="text-center space-y-1 text-sm">
              <p className="font-medium">Evolution API</p>
              <div className="flex flex-wrap justify-center gap-1">
                <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                <Badge variant="secondary" className="text-xs">Bots</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Datacenter Brasil</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>
              <strong>Arquitetura distribuída</strong> - Melhor prática! Separa carga e reduz pontos únicos de falha.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function VpsRecommendationsCard({ currentMetrics, isLoading }: VpsRecommendationsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Recomendações de VPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Recomendações de VPS
        </CardTitle>
        <CardDescription>
          Configurações recomendadas para sua infraestrutura distribuída
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Architecture Diagram */}
        <ArchitectureDiagram />

        {/* VPS Tiers */}
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              VPS Principal
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              VPS Evolution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {mainAppTiers.map((tier) => (
                <VpsTierCard key={tier.name} tier={tier} type="main" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evolution" className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {evolutionTiers.map((tier) => (
                <VpsTierCard key={tier.name} tier={tier} type="evolution" />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Providers */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Provedores Recomendados
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* International */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">🌍 Internacionais (Melhor custo-benefício)</p>
              <div className="space-y-2">
                {internationalProviders.map((provider) => (
                  <ProviderCard key={provider.name} provider={provider} />
                ))}
              </div>
            </div>

            {/* Brazil */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">🇧🇷 Brasil (Menor latência)</p>
              <div className="space-y-2">
                {brazilProviders.map((provider) => (
                  <ProviderCard key={provider.name} provider={provider} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tips based on metrics */}
        {currentMetrics && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">💡 Dicas baseadas no diagnóstico</h4>
            <div className="space-y-2 text-sm">
              {currentMetrics.server && currentMetrics.server.responseTime > 500 && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ Latência alta detectada ({currentMetrics.server.responseTime}ms) - Considere upgrade de RAM ou mais vCPUs
                </p>
              )}
              {currentMetrics.bundles && currentMetrics.bundles.some(b => b.size > 500) && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ Bundles grandes detectados - Mais vCPU pode acelerar builds
                </p>
              )}
              {currentMetrics.overallScore && currentMetrics.overallScore >= 80 && (
                <p className="text-green-600 dark:text-green-400">
                  ✅ Performance adequada para sua configuração atual
                </p>
              )}
              {currentMetrics.databaseLatency && currentMetrics.databaseLatency > 100 && (
                <p className="text-blue-600 dark:text-blue-400">
                  💡 Dica: Redis pode melhorar cache e reduzir latência do banco
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
