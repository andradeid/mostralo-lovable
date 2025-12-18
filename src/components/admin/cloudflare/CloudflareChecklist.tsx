import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CloudflareConfigCard } from "./CloudflareConfigCard";
import { CloudflareProgressBar } from "./CloudflareProgressBar";
import { Shield, Zap, Database, Globe, Lock, Server, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "cloudflare-guide-progress";

interface ConfigItem {
  id: string;
  title: string;
  description: string;
  config?: string;
  configType?: "json" | "text";
  dashboardUrl?: string;
  dashboardSection?: string;
  priority?: "critical" | "recommended" | "optional";
  warning?: string;
  impact?: string;
}

interface ConfigSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: ConfigItem[];
}

const sections: ConfigSection[] = [
  {
    id: "dns",
    title: "DNS Settings",
    icon: <Globe className="h-5 w-5" />,
    description: "Configurações básicas de DNS para melhor performance",
    items: [
      {
        id: "dns-proxy",
        title: "Ativar Proxy (Nuvem Laranja)",
        description: "Habilitar proxy do Cloudflare para todos os registros A e CNAME do seu domínio",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/dns",
        dashboardSection: "Abrir DNS Settings",
        priority: "critical",
        impact: "Reduz TTFB em 50-200ms ao servir conteúdo de edge servers próximos"
      },
      {
        id: "dns-flatten",
        title: "CNAME Flattening",
        description: "Ativar CNAME Flattening para root domain (apex)",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/dns",
        dashboardSection: "Abrir DNS Settings",
        priority: "recommended",
        impact: "Permite CNAME no root domain sem perda de performance"
      }
    ]
  },
  {
    id: "ssl",
    title: "SSL/TLS",
    icon: <Lock className="h-5 w-5" />,
    description: "Segurança e otimização de conexão HTTPS",
    items: [
      {
        id: "ssl-full-strict",
        title: "SSL Mode: Full (Strict)",
        description: "Definir modo SSL para Full (Strict) - requer certificado válido na origem",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls",
        dashboardSection: "Abrir SSL/TLS",
        priority: "critical",
        impact: "Máxima segurança na conexão entre Cloudflare e servidor de origem"
      },
      {
        id: "ssl-tls13",
        title: "Ativar TLS 1.3",
        description: "Habilitar TLS 1.3 para conexões mais rápidas e seguras",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls/edge-certificates",
        dashboardSection: "Abrir Edge Certificates",
        priority: "critical",
        impact: "Reduz latência de handshake SSL em até 100ms"
      },
      {
        id: "ssl-early-hints",
        title: "Ativar Early Hints",
        description: "Permite que o browser carregue recursos antes da resposta completa",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls/edge-certificates",
        dashboardSection: "Abrir Edge Certificates",
        priority: "recommended",
        impact: "Melhora LCP em 10-30% ao pré-carregar recursos críticos"
      },
      {
        id: "ssl-hsts",
        title: "Configurar HSTS",
        description: "Ativar HTTP Strict Transport Security com max-age de pelo menos 6 meses",
        config: "max-age=31536000; includeSubDomains; preload",
        configType: "text",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls/edge-certificates",
        dashboardSection: "Abrir Edge Certificates",
        priority: "recommended",
        impact: "Elimina redirecionamentos HTTP→HTTPS, melhora segurança"
      }
    ]
  },
  {
    id: "speed",
    title: "Speed Optimizations",
    icon: <Zap className="h-5 w-5" />,
    description: "Otimizações de velocidade e compressão",
    items: [
      {
        id: "speed-brotli",
        title: "Ativar Brotli",
        description: "Habilitar compressão Brotli para menor tamanho de transferência",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Abrir Speed",
        priority: "critical",
        impact: "Reduz tamanho de JS/CSS em 15-25% comparado a gzip"
      },
      {
        id: "speed-http2",
        title: "HTTP/2 + HTTP/3",
        description: "Garantir que HTTP/2 e HTTP/3 (QUIC) estejam habilitados",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Abrir Speed",
        priority: "critical",
        impact: "Multiplexação de requisições reduz latência total em 20-40%"
      },
      {
        id: "speed-minify",
        title: "Auto Minify",
        description: "Ativar minificação automática para JS, CSS e HTML",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Abrir Speed",
        priority: "recommended",
        impact: "Reduz tamanho de assets em 5-15%"
      },
      {
        id: "speed-polish",
        title: "Polish (Imagens) - PRO",
        description: "Otimização automática de imagens (requer plano Pro)",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Abrir Speed",
        priority: "optional",
        impact: "Reduz tamanho de imagens em 30-50% automaticamente"
      },
      {
        id: "speed-mirage",
        title: "Mirage (Lazy Load) - PRO",
        description: "Lazy loading inteligente de imagens (requer plano Pro)",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Abrir Speed",
        priority: "optional",
        impact: "Melhora LCP significativamente em conexões lentas"
      }
    ]
  },
  {
    id: "cache",
    title: "Cache Rules",
    icon: <Database className="h-5 w-5" />,
    description: "Regras de cache para máxima performance",
    items: [
      {
        id: "cache-level",
        title: "Caching Level: Standard",
        description: "Definir nível de cache para Standard ou Aggressive",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/caching/configuration",
        dashboardSection: "Abrir Caching",
        priority: "critical",
        impact: "Cache eficiente reduz requisições ao servidor de origem"
      },
      {
        id: "cache-ttl",
        title: "Browser Cache TTL",
        description: "Definir Browser Cache TTL para pelo menos 1 hora (recomendado: 1 dia para assets estáticos)",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/caching/configuration",
        dashboardSection: "Abrir Caching",
        priority: "recommended",
        impact: "Evita re-download de assets em visitas repetidas"
      },
      {
        id: "cache-static",
        title: "Cache Rule: Assets Estáticos",
        description: "Criar regra para cachear JS, CSS, imagens por 1 mês",
        config: `{
  "expression": "(http.request.uri.path.extension in {\\"js\\" \\"css\\" \\"png\\" \\"jpg\\" \\"jpeg\\" \\"gif\\" \\"webp\\" \\"svg\\" \\"woff2\\" \\"woff\\"})",
  "action": "set_cache_settings",
  "cache_ttl": 2592000,
  "browser_ttl": 2592000,
  "edge_ttl": 2592000
}`,
        configType: "json",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/caching/cache-rules",
        dashboardSection: "Abrir Cache Rules",
        priority: "critical",
        impact: "Assets servidos do edge com latência < 50ms"
      },
      {
        id: "cache-bypass-sw",
        title: "Cache Rule: Bypass Service Worker",
        description: "NUNCA cachear sw.js para evitar problemas de PWA",
        config: `{
  "expression": "(http.request.uri.path eq \\"/sw.js\\")",
  "action": "bypass_cache"
}`,
        configType: "json",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/caching/cache-rules",
        dashboardSection: "Abrir Cache Rules",
        priority: "critical",
        warning: "NUNCA cachear sw.js! Isso pode causar problemas sérios de PWA onde usuários ficam com versões antigas.",
        impact: "Evita que usuários fiquem presos em versões antigas do PWA"
      }
    ]
  },
  {
    id: "firewall",
    title: "Firewall & Security",
    icon: <Shield className="h-5 w-5" />,
    description: "Proteção contra bots e ataques",
    items: [
      {
        id: "firewall-bot",
        title: "Bot Fight Mode",
        description: "Ativar proteção contra bots maliciosos",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/security/bots",
        dashboardSection: "Abrir Bots",
        priority: "recommended",
        impact: "Bloqueia scrapers e bots que consomem recursos"
      },
      {
        id: "firewall-challenge",
        title: "Security Level: Medium",
        description: "Definir nível de segurança para Medium (balanceado)",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/security/settings",
        dashboardSection: "Abrir Security Settings",
        priority: "recommended",
        impact: "Protege contra ataques sem impactar usuários legítimos"
      },
      {
        id: "firewall-rate-limit",
        title: "Rate Limiting",
        description: "Configurar rate limiting para endpoints sensíveis (login, API)",
        config: `{
  "expression": "(http.request.uri.path contains \\"/auth\\" or http.request.uri.path contains \\"/api\\")",
  "action": "rate_limit",
  "requests_per_period": 100,
  "period": 60
}`,
        configType: "json",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/security/waf/rate-limiting-rules",
        dashboardSection: "Abrir Rate Limiting",
        priority: "recommended",
        impact: "Protege contra ataques de força bruta e DDoS em L7"
      }
    ]
  },
  {
    id: "transform",
    title: "Transform Rules",
    icon: <Server className="h-5 w-5" />,
    description: "Headers e modificações de requisição",
    items: [
      {
        id: "transform-cache-control",
        title: "Add Cache-Control Header",
        description: "Adicionar header Cache-Control para assets estáticos",
        config: `Set response header:
Header name: Cache-Control
Header value: public, max-age=31536000, immutable

Expression: (http.request.uri.path.extension in {"js" "css" "png" "jpg" "jpeg" "gif" "webp" "svg" "woff2" "woff"})`,
        configType: "text",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/rules/transform-rules/modify-response-header",
        dashboardSection: "Abrir Transform Rules",
        priority: "recommended",
        impact: "Garante cache longo mesmo se servidor não enviar header"
      },
      {
        id: "transform-security-headers",
        title: "Security Headers",
        description: "Adicionar headers de segurança (X-Frame-Options, X-Content-Type-Options)",
        config: `Set response headers:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin`,
        configType: "text",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/rules/transform-rules/modify-response-header",
        dashboardSection: "Abrir Transform Rules",
        priority: "recommended",
        impact: "Melhora segurança e pontuação em auditorias"
      }
    ]
  },
  {
    id: "warnings",
    title: "⚠️ Cuidados Importantes",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    description: "Configurações que devem ser evitadas ou tratadas com cuidado",
    items: [
      {
        id: "warn-rocket-loader",
        title: "NÃO ativar Rocket Loader",
        description: "Rocket Loader pode quebrar aplicações React/SPA",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/speed/optimization",
        dashboardSection: "Verificar Speed",
        priority: "critical",
        warning: "Rocket Loader reescreve scripts e pode quebrar React, Vue e outras SPAs. MANTENHA DESATIVADO!",
        impact: "Evita erros de JavaScript e tela branca"
      },
      {
        id: "warn-email-obfuscation",
        title: "Desativar Email Obfuscation se usar formulários",
        description: "Email Obfuscation pode interferir em campos de email em formulários",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/content-protection",
        dashboardSection: "Abrir Scrape Shield",
        priority: "recommended",
        warning: "Se você tem formulários com campos de email, desative esta opção para evitar problemas.",
        impact: "Evita problemas em campos de formulário"
      },
      {
        id: "warn-development-mode",
        title: "Desativar Development Mode em produção",
        description: "Development Mode desativa todo o cache - usar apenas para debug",
        dashboardUrl: "https://dash.cloudflare.com/?to=/:account/:zone/caching/configuration",
        dashboardSection: "Verificar Caching",
        priority: "critical",
        warning: "Development Mode DESATIVA todo cache. Use apenas para debug rápido e desative imediatamente!",
        impact: "Mantém performance de produção"
      }
    ]
  }
];

export function CloudflareChecklist() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Carregar progresso do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCompletedItems(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    }
  }, []);

  // Salvar progresso no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedItems]));
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  }, [completedItems]);

  const handleToggle = (id: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
  const completedCount = completedItems.size;

  const getSectionProgress = (section: ConfigSection) => {
    const completed = section.items.filter(item => completedItems.has(item.id)).length;
    return { completed, total: section.items.length };
  };

  return (
    <div className="space-y-6">
      <CloudflareProgressBar completed={completedCount} total={totalItems} />

      <Accordion type="multiple" defaultValue={["dns", "ssl"]} className="space-y-4">
        {sections.map(section => {
          const { completed, total } = getSectionProgress(section);
          const isComplete = completed === total;
          
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className={`border rounded-lg px-4 ${isComplete ? "border-green-500/30 bg-green-500/5" : ""}`}
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 w-full">
                  <div className={`${isComplete ? "text-green-500" : "text-muted-foreground"}`}>
                    {section.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-muted-foreground">{section.description}</div>
                  </div>
                  <Badge variant={isComplete ? "default" : "secondary"} className="ml-auto mr-2">
                    {completed}/{total}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-4">
                  {section.items.map(item => (
                    <CloudflareConfigCard
                      key={item.id}
                      {...item}
                      isCompleted={completedItems.has(item.id)}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
