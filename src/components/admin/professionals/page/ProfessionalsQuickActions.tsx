// Ações rápidas (agenda, serviços, página pública, novo profissional).
// JSX movido da ProfessionalsPage sem mudança.
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Calendar, ExternalLink, Settings } from 'lucide-react';


interface ProfessionalsQuickActionsProps {
  storeSlug: string | null;
  resetForm: () => void;
  setIsCreateDialogOpen: (open: boolean) => void;
}

export function ProfessionalsQuickActions({ storeSlug, resetForm, setIsCreateDialogOpen }: ProfessionalsQuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
            <Link to="/dashboard/booking">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Ver Agenda</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
            <Link to="/dashboard/booking/services">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Serviços</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
            <a
              href={storeSlug ? `/agendar/${storeSlug}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!storeSlug) e.preventDefault(); }}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs">Pág. Pública</span>
            </a>
          </Button>
          <Button size="sm" className="h-auto py-3 flex-col gap-1.5 bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <UserPlus className="h-4 w-4" />
            <span className="text-xs font-semibold">Novo Prof.</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
