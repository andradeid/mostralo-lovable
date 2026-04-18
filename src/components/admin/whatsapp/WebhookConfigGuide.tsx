import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BellRing,
  MessageSquareText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  BookOpen,
  Zap,
  Database,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof BellRing;
  badgeLabel: string;
  badgeClass: string;
  borderClass: string;
  iconBgClass: string;
  whenToUse: string[];
  webhookEnabled: boolean;
  events: { name: string; allow: boolean; reason: string }[];
  excludes: string[];
  dbImpact: { level: "Nenhum" | "Baixo" | "Alto"; tone: "good" | "warn" | "bad"; note: string };
};

const PROFILES: Profile[] = [
  {
    id: "notifications-only",
    title: "Apenas Notificações",
    subtitle: "Envia confirmações, lembretes e cobranças PIX. Não recebe nada.",
    icon: BellRing,
    badgeLabel: "whatsapp_connection",
    badgeClass: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    borderClass: "border-l-4 border-l-blue-500",
    iconBgClass: "bg-blue-500/15 text-blue-600",
    whenToUse: [
      "Loja usa apenas o módulo de Agendamentos ou notificações automáticas",
      "Não há atendimento humano via WhatsApp",
      "Não há robô de IA respondendo no WhatsApp",
      "Exemplo: barbearias, clínicas, salões que só enviam lembretes",
    ],
    webhookEnabled: false,
    events: [
      { name: "connection", allow: false, reason: "Não precisa monitorar status em tempo real" },
      { name: "messages", allow: false, reason: "Não vai receber mensagens de clientes" },
      { name: "messages_update", allow: false, reason: "Status de leitura/entrega irrelevante" },
      { name: "contacts", allow: false, reason: "Sem uso para envio de notificação" },
      { name: "presence", allow: false, reason: "Maior ofensor — dispara a cada contato online" },
    ],
    excludes: [],
    dbImpact: {
      level: "Nenhum",
      tone: "good",
      note: "Webhook desligado = zero queries no banco. Envio de notificação usa API direta.",
    },
  },
  {
    id: "chat-active",
    title: "Atendimento Humano + Notificações",
    subtitle: "Painel de chat ativo, atendentes respondem clientes manualmente.",
    icon: MessageSquareText,
    badgeLabel: "whatsapp_chat",
    badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    borderClass: "border-l-4 border-l-emerald-500",
    iconBgClass: "bg-emerald-500/15 text-emerald-600",
    whenToUse: [
      "Loja usa o painel de chat do Mostralo para conversar com clientes",
      "Atendentes humanos precisam ver mensagens recebidas em tempo real",
      "Há histórico de conversas sendo persistido",
    ],
    webhookEnabled: true,
    events: [
      { name: "messages", allow: true, reason: "Necessário para receber mensagens no painel" },
      { name: "connection", allow: true, reason: "Saber quando a instância cair" },
      { name: "messages_update", allow: false, reason: "Status de leitura inflaciona o banco" },
      { name: "contacts", allow: false, reason: "Não usado pelo painel" },
      { name: "presence", allow: false, reason: "Dispara constantemente, sem benefício" },
    ],
    excludes: ["wasSentByApi", "isGroupYes"],
    dbImpact: {
      level: "Baixo",
      tone: "warn",
      note: "Apenas mensagens reais entram. Status e presença ficam de fora.",
    },
  },
  {
    id: "ai-bot",
    title: "Robô de IA + Atendimento",
    subtitle: "Assistente automático responde sozinho, com fallback humano.",
    icon: Zap,
    badgeLabel: "whatsapp_chat + ai_bot",
    badgeClass: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    borderClass: "border-l-4 border-l-purple-500",
    iconBgClass: "bg-purple-500/15 text-purple-600",
    whenToUse: [
      "Loja tem o módulo de Robô de IA ativo",
      "Mensagens precisam ser processadas pela OpenAI Assistants",
      "Reações são sincronizadas com o painel Master",
    ],
    webhookEnabled: true,
    events: [
      { name: "messages", allow: true, reason: "Trigger principal do bot" },
      { name: "connection", allow: true, reason: "Reconectar se cair" },
      { name: "messages_update", allow: false, reason: "Não afeta a lógica do bot" },
      { name: "contacts", allow: false, reason: "Bot não usa contatos sincronizados" },
      { name: "presence", allow: false, reason: "Sem uso, gera ruído" },
    ],
    excludes: ["wasSentByApi", "isGroupYes"],
    dbImpact: {
      level: "Baixo",
      tone: "warn",
      note: "Carga controlada. Reações são processadas inline sem extras.",
    },
  },
];

const DB_TONE: Record<"good" | "warn" | "bad", string> = {
  good: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  bad: "bg-destructive/15 text-destructive border-destructive/30",
};

function ProfileCard({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(profile.id === "notifications-only");
  const Icon = profile.icon;

  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", profile.borderClass)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn("rounded-lg p-2 shrink-0", profile.iconBgClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                      {profile.title}
                      <Badge variant="outline" className={cn("text-[10px] font-mono", profile.badgeClass)}>
                        {profile.badgeLabel}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                      {profile.subtitle}
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Quando usar */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Quando usar este perfil
              </p>
              <ul className="space-y-1.5">
                {profile.whenToUse.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs md:text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Webhook habilitado */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Webhook
              </div>
              {profile.webhookEnabled ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Habilitado
                </Badge>
              ) : (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20">
                  <XCircle className="h-3 w-3 mr-1" /> Desligado
                </Badge>
              )}
              {!profile.webhookEnabled && (
                <span className="text-xs text-muted-foreground">
                  Envio de mensagem não depende de webhook
                </span>
              )}
            </div>

            {/* Eventos */}
            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Eventos a escutar na UaZapi
                </p>
              </div>
              <div className="divide-y">
                {profile.events.map((evt) => (
                  <div key={evt.name} className="flex items-start justify-between gap-3 px-3 py-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {evt.allow ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <code className="text-xs md:text-sm font-mono font-medium">{evt.name}</code>
                        <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                          {evt.reason}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        evt.allow
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      )}
                    >
                      {evt.allow ? "Manter" : "Remover"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Excludes */}
            {profile.excludes.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Excluir dos eventos escutados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.excludes.map((ex) => (
                    <Badge key={ex} variant="secondary" className="font-mono text-[11px]">
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Impacto no banco */}
            <div className={cn("rounded-lg border p-3", DB_TONE[profile.dbImpact.tone])}>
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Impacto no banco: {profile.dbImpact.level}
                </p>
              </div>
              <p className="text-xs">{profile.dbImpact.note}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function WebhookConfigGuide() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg md:text-xl">
              Guia de Configuração de Webhook
            </CardTitle>
            <CardDescription className="mt-1 text-xs md:text-sm">
              Configure cada instância da UaZapi conforme o módulo que ela usa para evitar sobrecarga no banco.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aviso crítico */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 md:p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs md:text-sm space-y-1">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Por que isso importa?
              </p>
              <p className="text-muted-foreground">
                Eventos como <code className="font-mono">presence</code> e{" "}
                <code className="font-mono">messages_update</code> disparam centenas de chamadas por
                minuto. Se a instância só envia notificações, esses eventos saturam o pool de
                conexões do banco e travam o sistema inteiro.
              </p>
            </div>
          </div>
        </div>

        {/* Perfis */}
        <div className="space-y-3">
          {PROFILES.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>

        {/* Como aplicar */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Como aplicar na UaZapi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs md:text-sm">
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>Acesse o painel da UaZapi e abra a instância desejada</li>
              <li>Vá até a aba <strong className="text-foreground">Webhooks</strong></li>
              <li>
                Identifique o perfil correto acima (Notificações, Atendimento ou Robô de IA)
              </li>
              <li>
                Ajuste o toggle <strong className="text-foreground">Habilitado</strong> e os
                eventos conforme indicado
              </li>
              <li>
                Adicione os filtros <code className="font-mono">wasSentByApi</code> e{" "}
                <code className="font-mono">isGroupYes</code> em "Excluir" quando o webhook estiver
                ligado
              </li>
              <li>Salve e monitore os logs do <code className="font-mono">uazapi-webhook</code></li>
            </ol>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open("https://uazapi.com", "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Abrir painel UaZapi
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
