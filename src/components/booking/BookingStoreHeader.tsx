import { MapPin, Store as StoreIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BookingStoreHeaderProps {
  store: {
    name: string;
    logo_url?: string | null;
    cover_url?: string | null;
    description?: string | null;
    city?: string | null;
    state?: string | null;
    segment?: string | null;
  };
}

export const BookingStoreHeader = ({ store }: BookingStoreHeaderProps) => {
  const hasLocation = store.city || store.state;
  const locationText = [store.city, store.state].filter(Boolean).join(', ');

  return (
    <div className="relative overflow-hidden rounded-xl mb-6">
      {/* Background - Cover or Gradient */}
      {store.cover_url ? (
        <div className="absolute inset-0">
          <img 
            src={store.cover_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}

      {/* Content */}
      <div className={cn(
        "relative z-10 p-6",
        store.cover_url ? "text-white" : "text-foreground"
      )}>
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className={cn(
            "w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center",
            store.cover_url ? "bg-white/10 backdrop-blur-sm" : "bg-muted"
          )}>
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <StoreIcon className={cn(
                "w-8 h-8",
                store.cover_url ? "text-white/80" : "text-muted-foreground"
              )} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              "text-xl md:text-2xl font-bold truncate",
              store.cover_url ? "text-white" : "text-foreground"
            )}>
              {store.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {hasLocation && (
                <span className={cn(
                  "flex items-center gap-1 text-sm",
                  store.cover_url ? "text-white/80" : "text-muted-foreground"
                )}>
                  <MapPin className="w-3.5 h-3.5" />
                  {locationText}
                </span>
              )}
              
              {store.segment && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    store.cover_url && "bg-white/20 text-white border-0 hover:bg-white/30"
                  )}
                >
                  {store.segment}
                </Badge>
              )}
            </div>

            {store.description && (
              <p className={cn(
                "mt-3 text-sm line-clamp-2",
                store.cover_url ? "text-white/90" : "text-muted-foreground"
              )}>
                {store.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
