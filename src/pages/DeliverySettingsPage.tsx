import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2, Smartphone, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { soundNames, NotificationSound, playNewOrderSound, getSelectedSound, setSelectedSound } from "@/utils/soundPlayer";

export default function DeliverySettingsPage() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSoundState] = useState<NotificationSound>(getSelectedSound());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("orderSoundEnabled");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }

    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem("orderSoundEnabled", checked.toString());
    toast({
      title: checked ? "Som ativado" : "Som desativado",
      description: checked
        ? "Você receberá notificações sonoras"
        : "Notificações sonoras desativadas",
    });
  };

  const handleSoundChange = (sound: NotificationSound) => {
    setSelectedSoundState(sound);
    setSelectedSound(sound);
    playNewOrderSound(sound);
    toast({
      title: "Som alterado",
      description: `Agora você ouvirá "${soundNames[sound]}"`,
    });
  };

  const handleTestSound = () => {
    playNewOrderSound(selectedSound);
    toast({
      title: "Som testado",
      description: "Você deve ter ouvido o som selecionado",
    });
  };

  const handleRequestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      toast({
        title: permission === "granted" ? "Permissão concedida" : "Permissão negada",
        description:
          permission === "granted"
            ? "Você receberá notificações push"
            : "Você não receberá notificações push",
        variant: permission === "granted" ? "default" : "destructive",
      });
    }
  };

  const handleTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Teste de Notificação", {
        body: "Esta é uma notificação de teste",
        icon: "/favicon.png",
      });
      toast({
        title: "Notificação enviada",
        description: "Você deve ter recebido uma notificação",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize suas preferências de entrega
        </p>
      </div>

      {/* Notificações Sonoras */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle>Notificações Sonoras</CardTitle>
          </div>
          <CardDescription>
            Configure como você deseja ser alertado sobre novos pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle" className="cursor-pointer">
              Som ativado
            </Label>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {soundEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sound-select">Tom de notificação</Label>
                <Select value={selectedSound} onValueChange={handleSoundChange}>
                  <SelectTrigger id="sound-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(soundNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleTestSound} variant="outline" className="w-full">
                <Volume2 className="mr-2 h-4 w-4" />
                Testar Som
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificações Push */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notificações Push</CardTitle>
          </div>
          <CardDescription>
            Receba alertas mesmo quando o app estiver em segundo plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Status das notificações</Label>
            <span className={`text-sm font-medium ${notificationsEnabled ? "text-green-600" : "text-muted-foreground"}`}>
              {notificationsEnabled ? "Ativadas" : "Desativadas"}
            </span>
          </div>

          {!notificationsEnabled && (
            <Button onClick={handleRequestNotifications} className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Ativar Notificações
            </Button>
          )}

          {notificationsEnabled && (
            <Button onClick={handleTestNotification} variant="outline" className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Testar Notificação
            </Button>
          )}
        </CardContent>
      </Card>

      {/* PWA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>App Instalado</CardTitle>
          </div>
          <CardDescription>
            Instale o app no seu celular para melhor experiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para instalar o app na tela inicial do seu celular:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>No iOS: Toque em "Compartilhar" e depois "Adicionar à Tela de Início"</li>
            <li>No Android: Toque no menu e depois "Adicionar à tela inicial"</li>
          </ul>
        </CardContent>
      </Card>

      {/* Debug (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <CardTitle>Debug</CardTitle>
            </div>
            <CardDescription>
              Ferramentas de desenvolvimento (visível apenas em modo dev)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => {
                localStorage.clear();
                toast({ title: "Cache limpo", description: "Todas as configurações locais foram removidas" });
              }}
              variant="outline"
              className="w-full"
            >
              Limpar Cache Local
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
