// Abas da tela WhatsApp Master.
// JSX movido da MasterWhatsAppPage sem mudança.
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Smartphone, Bot, Users, ExternalLink, BookOpen } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function MasterWhatsAppTabsList({ wa, tests, cfg }: MasterWhatsAppPageApi) {

  return (
    <>
    <TooltipProvider delayDuration={300}>
      <TabsList className="w-full flex flex-wrap justify-start gap-1 p-1 h-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="connection" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Conexão WhatsApp</span>
              <span className="sm:hidden">Conexão</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Conecte sua instância do WhatsApp, escaneie o QR Code e envie mensagens de teste</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="bots" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar Bots</span>
              <span className="sm:hidden">Bots</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Ative e configure os bots de vendas, recrutamento e suporte com prompts personalizados</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="faq" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Base de Conhecimento</span>
              <span className="sm:hidden">FAQ</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Adicione perguntas e respostas para o bot consultar durante os atendimentos</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="sessions" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Sessões de Atendimento</span>
              <span className="sm:hidden">Sessões</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Veja todas as conversas ativas, pausadas e o histórico de mensagens</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="links" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Links e Páginas</span>
              <span className="sm:hidden">Links</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Configure os links de WhatsApp que aparecem nas páginas do site</p>
          </TooltipContent>
        </Tooltip>
      </TabsList>
    </TooltipProvider>
    </>
  );
}
