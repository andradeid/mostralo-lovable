import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  RefreshCw, 
  Power, 
  PowerOff, 
  Trash2, 
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Phone,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface WhatsAppStatusCardMobileProps {
  instance: any;
  actionLoading: string | null;
  contactsCount: number;
  messagesCount: number;
  pausedSessionsCount: number;
  onConnect: () => void;
  onCheckStatus: () => void;
  onRestart: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

export function WhatsAppStatusCardMobile({
  instance,
  actionLoading,
  contactsCount,
  messagesCount,
  pausedSessionsCount,
  onConnect,
  onCheckStatus,
  onRestart,
  onDisconnect,
  onDelete,
}: WhatsAppStatusCardMobileProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500 text-white"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>;
      case 'banned':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Banido</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Desconectado</Badge>;
    }
  };

  const isConnected = instance?.status === 'connected';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header compacto com status */}
        <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
          {instance.profile_picture_url ? (
            <img 
              src={instance.profile_picture_url} 
              alt="Perfil" 
              className="h-12 w-12 rounded-full border-2 border-primary/30 shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge(instance.status)}
            </div>
            {instance.phone_number && (
              <p className="text-sm font-medium truncate">+{instance.phone_number}</p>
            )}
            {instance.profile_name && !instance.phone_number && (
              <p className="text-sm text-muted-foreground truncate">{instance.profile_name}</p>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="shrink-0"
            onClick={onCheckStatus}
            disabled={!!actionLoading}
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Estatísticas inline quando conectado */}
        {isConnected && (contactsCount > 0 || messagesCount > 0) && (
          <div className="flex justify-around py-2 px-3 border-b bg-background">
            <div className="text-center">
              <span className="text-lg font-bold text-blue-500">{contactsCount}</span>
              <p className="text-[10px] text-muted-foreground">contatos</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-green-500">{messagesCount}</span>
              <p className="text-[10px] text-muted-foreground">mensagens</p>
            </div>
            {pausedSessionsCount > 0 && (
              <div className="text-center">
                <span className="text-lg font-bold text-orange-500">{pausedSessionsCount}</span>
                <p className="text-[10px] text-muted-foreground">pausadas</p>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação principais */}
        <div className="p-3 space-y-2">
          {instance.status !== 'connected' && (
            <Button 
              onClick={onConnect} 
              disabled={actionLoading === 'connect'}
              className="w-full"
              size="sm"
            >
              {actionLoading === 'connect' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando QR...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </>
              )}
            </Button>
          )}

          {isConnected && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={onRestart}
                disabled={actionLoading === 'restart'}
                size="sm"
                className="text-yellow-600 border-yellow-200 bg-yellow-50/50"
              >
                {actionLoading === 'restart' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="ml-1">Reiniciar</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={onDisconnect}
                disabled={actionLoading === 'disconnect'}
                size="sm"
              >
                {actionLoading === 'disconnect' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PowerOff className="h-4 w-4" />
                )}
                <span className="ml-1">Desconectar</span>
              </Button>
            </div>
          )}

          {/* Ver mais detalhes */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-muted-foreground"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Ocultar detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver detalhes
              </>
            )}
          </Button>

          {showDetails && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><span className="font-medium">Instância:</span> {instance.instance_name}</p>
                {instance.profile_name && (
                  <p><span className="font-medium">Perfil:</span> {instance.profile_name}</p>
                )}
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!!actionLoading} className="w-full" size="sm">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remover Instância
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover Instância?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover a conexão. Você precisará escanear o QR Code novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
