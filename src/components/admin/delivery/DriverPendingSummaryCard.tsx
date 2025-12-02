import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/utils/driverEarnings";
import { Package, DollarSign, User } from "lucide-react";

interface DriverPendingSummaryCardProps {
  driverName: string;
  driverId: string;
  avatarUrl?: string;
  pendingCount: number;
  totalAmount: number;
  earningIds: string[];
  onPayClick: () => void;
}

export function DriverPendingSummaryCard({
  driverName,
  avatarUrl,
  pendingCount,
  totalAmount,
  onPayClick,
}: DriverPendingSummaryCardProps) {
  const initials = driverName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header com avatar e nome */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={driverName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{driverName}</p>
          </div>
        </div>

        {/* Info de entregas pendentes */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{pendingCount} entrega{pendingCount !== 1 ? "s" : ""} pendente{pendingCount !== 1 ? "s" : ""}</span>
        </div>

        {/* Valor total */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-600" />
          <span className="text-xl font-bold text-amber-600">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Botão de pagamento */}
        <Button 
          onClick={onPayClick} 
          className="w-full"
          size="sm"
        >
          💵 Pagar Tudo
        </Button>
      </CardContent>
    </Card>
  );
}
