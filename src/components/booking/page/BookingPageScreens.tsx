// Telas inteiras da página de agendamento fora do fluxo: carregando, agendamento pausado e loja não encontrada.
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Loader2, Store } from 'lucide-react';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';
import type { StoreInfo } from '@/lib/bookingPage/types';

export function BookingLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Booking channel is disabled - show paused message
export function BookingPausedScreen({ store, channelMessage }: { store: StoreInfo; channelMessage: string }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{store.name}</h1>
              <p className="text-sm text-muted-foreground">Agendamento Online</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <SalesChannelPausedBanner message={channelMessage} />
        <Card className="mt-4">
          <CardContent className="py-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Agendamentos Temporariamente Pausados</h2>
            <p className="text-muted-foreground">
              Entre em contato diretamente com o estabelecimento para realizar seu agendamento.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function BookingNotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
          <p className="text-muted-foreground">Verifique o endereço e tente novamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
