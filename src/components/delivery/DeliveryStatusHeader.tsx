import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, Package, DollarSign } from "lucide-react";

interface DeliveryStatusHeaderProps {
  driverName: string;
  isOnline: boolean;
  onOnlineToggle: (checked: boolean) => void;
  todayStats: {
    total: number;
    completed: number;
    totalEarned: number;
  };
}

export function DeliveryStatusHeader({
  driverName,
  isOnline,
  onOnlineToggle,
  todayStats,
}: DeliveryStatusHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const firstName = driverName.split(" ")[0];

  return (
    <Card className="p-4 md:p-6 mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold mb-1">
            Olá, {firstName}! 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Você está online e pronto para entregas" : "Você está offline"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="online-status"
              checked={isOnline}
              onCheckedChange={onOnlineToggle}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="online-status" className="font-semibold cursor-pointer">
              {isOnline ? (
                <span className="text-green-600">Online</span>
              ) : (
                <span className="text-muted-foreground">Offline</span>
              )}
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border">
          <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mb-2" />
          <span className="text-lg md:text-2xl font-bold">{todayStats.total}</span>
          <span className="text-xs md:text-sm text-muted-foreground text-center">
            Total
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border">
          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 mb-2" />
          <span className="text-lg md:text-2xl font-bold text-green-600">
            {todayStats.completed}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground text-center">
            Concluídas
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border">
          <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary mb-2" />
          <span className="text-lg md:text-2xl font-bold">
            {formatCurrency(todayStats.totalEarned)}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground text-center">
            Ganho Hoje
          </span>
        </div>
      </div>
    </Card>
  );
}
