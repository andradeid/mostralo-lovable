import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, ShoppingCart, LogOut, User } from 'lucide-react';

interface TableMenuHeaderProps {
  storeName?: string;
  logoUrl?: string | null;
  tableNumber: string;
  customerName: string;
  comandaNumber: string;
  itemsCount: number;
  showSummary: boolean;
  onToggleSummary: () => void;
  onLogout: () => void;
}

export function TableMenuHeader({
  storeName,
  logoUrl,
  tableNumber,
  customerName,
  comandaNumber,
  itemsCount,
  showSummary,
  onToggleSummary,
  onLogout
}: TableMenuHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div>
            <p className="font-semibold">{storeName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-3 w-3" />
              Mesa {tableNumber}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleSummary}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemsCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {itemsCount}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Customer info */}
      <div className="px-4 pb-3 flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span>{customerName}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-primary font-medium">Comanda #{comandaNumber}</span>
      </div>
    </>
  );
}
