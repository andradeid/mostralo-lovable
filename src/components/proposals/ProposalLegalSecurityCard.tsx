import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, Globe, Calendar, Monitor, CheckCircle, XCircle 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalLegalSecurityCardProps {
  acceptIpAddress?: string | null;
  acceptUserAgent?: string | null;
  acceptedAt?: string | null;
  termsAccepted?: boolean | null;
  lgpdAccepted?: boolean | null;
}

export function ProposalLegalSecurityCard({
  acceptIpAddress,
  acceptUserAgent,
  acceptedAt,
  termsAccepted,
  lgpdAccepted,
}: ProposalLegalSecurityCardProps) {
  const formattedDate = acceptedAt 
    ? format(new Date(acceptedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : null;

  // Truncar User Agent para exibição
  const truncatedUserAgent = acceptUserAgent && acceptUserAgent.length > 60
    ? `${acceptUserAgent.substring(0, 60)}...`
    : acceptUserAgent;

  return (
    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Shield className="h-5 w-5" />
          Segurança Jurídica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IP do Cliente */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block">Endereço IP</span>
              <span className="text-sm font-medium">{acceptIpAddress || 'Não registrado'}</span>
            </div>
          </div>

          {/* Data/Hora Aceitação */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block">Data/Hora da Aceitação</span>
              <span className="text-sm font-medium">{formattedDate || 'Não registrado'}</span>
            </div>
          </div>

          {/* Termos de Uso */}
          <div className="flex items-center gap-2">
            {termsAccepted ? (
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block">Termos de Uso</span>
              <span className={`text-sm font-medium ${termsAccepted ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {termsAccepted ? 'Aceito' : 'Não aceito'}
              </span>
            </div>
          </div>

          {/* Política de Privacidade (LGPD) */}
          <div className="flex items-center gap-2">
            {lgpdAccepted ? (
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block">Política de Privacidade (LGPD)</span>
              <span className={`text-sm font-medium ${lgpdAccepted ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {lgpdAccepted ? 'Aceito' : 'Não aceito'}
              </span>
            </div>
          </div>
        </div>

        {/* User Agent - linha separada */}
        {acceptUserAgent && (
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start gap-2 cursor-help">
                    <Monitor className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground block">Dispositivo/Navegador</span>
                      <span className="text-sm text-muted-foreground truncate block">
                        {truncatedUserAgent}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-md">
                  <p className="text-xs break-all">{acceptUserAgent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
