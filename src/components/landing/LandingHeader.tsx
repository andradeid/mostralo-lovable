import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Store,
  Menu,
  X,
  Briefcase
} from 'lucide-react';

export const LandingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-full overflow-hidden">
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
            href="#marketing-digital" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Marketing Digital
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
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 w-9 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link to="/auth" className="hidden sm:block">
            <Button variant="outline" size="sm" className="md:size-default text-xs sm:text-sm">Entrar</Button>
          </Link>
          <Link to="/signup" className="flex-shrink-0">
            <Button size="sm" className="md:size-default text-xs sm:text-sm px-3 sm:px-4">Começar</Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-4 flex flex-col space-y-3">
            <a 
              href="#recursos" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Recursos
            </a>
            <a 
              href="#calculadora" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculadora
            </a>
            <a 
              href="#marketing-digital" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketing Digital
            </a>
            <a 
              href="#whatsapp-marketing" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              WhatsApp
            </a>
            <a 
              href="#integracao-ia" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              IA
            </a>
            <a 
              href="#plans" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Planos
            </a>
            <Link 
              to="/funcionalidades" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </Link>
            <Link 
              to="/sobre" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link 
              to="/seja-vendedor" 
              className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-3 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Briefcase className="w-4 h-4" />
              Trabalhe Conosco
            </Link>
            <Link to="/auth" className="sm:hidden" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Entrar</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
