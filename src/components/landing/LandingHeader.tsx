import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Store,
  Menu,
  Briefcase,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
export const LandingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case 'master_admin':
      case 'store_admin':
      case 'attendant':
        return '/dashboard';
      case 'delivery_driver':
        return '/delivery-panel';
      case 'professional':
        return '/profissional';
      case 'salesperson':
        return '/vendedor';
      default:
        return '/dashboard';
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative container flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-0">
          <Store className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-primary truncate">Mostralo</h1>
        </div>
        
        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
          <a 
            href="#recursos" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Recursos
          </a>
          <a 
            href="#calculadora" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Calculadora
          </a>
          <a 
            href="#whatsapp-marketing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            WhatsApp
          </a>
          <a 
            href="#gestao-financeira" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Financeiro
          </a>
          <a 
            href="#integracao-ia" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            IA
          </a>
          <a 
            href="#plans" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Planos
          </a>
          <Link 
            to="/funcionalidades" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Funcionalidades
          </Link>
          <Link 
            to="/sobre" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Sobre
          </Link>
          <Link 
            to="/seja-vendedor" 
            className="flex items-center gap-1.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            Trabalhe Conosco
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 w-9 p-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Store className="w-6 h-6 text-primary" />
                  <span className="text-primary font-bold">Mostralo</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 space-y-1">
                <a 
                  href="#recursos" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recursos
                </a>
                <a 
                  href="#calculadora" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calculadora
                </a>
                <a 
                  href="#whatsapp-marketing"
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  WhatsApp
                </a>
                <a 
                  href="#integracao-ia" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  IA
                </a>
                <a 
                  href="#plans" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Planos
                </a>
                <Link 
                  to="/funcionalidades" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Funcionalidades
                </Link>
                <Link 
                  to="/sobre" 
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors py-2.5 px-3 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sobre
                </Link>
                
                <div className="pt-3 border-t mt-3 space-y-2">
                  <Link 
                    to="/seja-vendedor" 
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4" />
                    Trabalhe Conosco
                  </Link>
                  {user ? (
                    <>
                      <Link 
                        to={getDashboardPath()} 
                        className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 py-2.5 px-3 rounded-md hover:bg-muted"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Acessar Painel
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Entrar</Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {user ? (
            <>
              <Link to={getDashboardPath()} className="hidden sm:block">
                <Button variant="outline" size="sm" className="md:size-default text-xs sm:text-sm gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Painel
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex md:size-default text-xs sm:text-sm gap-1.5 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="outline" size="sm" className="md:size-default text-xs sm:text-sm">Entrar</Button>
              </Link>
              <Link to="/signup" className="flex-shrink-0">
                <Button size="sm" className="md:size-default text-xs sm:text-sm px-3 sm:px-4">Começar</Button>
              </Link>
            </>
          )}
        </div>
      </div>

    </header>
  );
};
