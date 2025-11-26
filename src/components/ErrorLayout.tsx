import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

interface ErrorLayoutProps {
  code?: string;
  icon: ReactNode;
  title: string;
  description: string;
  subtitle?: string;
  children?: ReactNode;
  showHomeButton?: boolean;
}

export const ErrorLayout = ({
  code,
  icon,
  title,
  description,
  subtitle,
  children,
  showHomeButton = true,
}: ErrorLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-background dark:via-orange-950/10 dark:to-amber-950/20 px-4 py-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Código grande estilizado */}
        {code && (
          <div className="text-[120px] md:text-[180px] font-bold leading-none text-primary/20 dark:text-primary/10 select-none">
            {code}
          </div>
        )}

        {/* Ícone animado */}
        <div className="flex justify-center -mt-8">
          <div className="p-6 rounded-full bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border shadow-lg">
            {icon}
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display">
          {title}
        </h1>

        {/* Descrição */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
          {description}
        </p>

        {/* Subtítulo opcional */}
        {subtitle && (
          <p className="text-sm text-muted-foreground/80 italic">
            {subtitle}
          </p>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {children}
          {showHomeButton && (
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Ir para o início
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
