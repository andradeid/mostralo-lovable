import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function FeaturesHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Mostralo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Início
            </Link>
            <Link to="/#recursos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Recursos
            </Link>
            <Link to="/#plans" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Planos
            </Link>
            <span className="text-primary font-medium text-sm">
              Funcionalidades
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth" className="hidden md:block">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup" className="hidden md:block">
              <Button size="sm">Começar</Button>
            </Link>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border mt-3 space-y-3">
            <Link to="/" className="block text-muted-foreground hover:text-foreground">Início</Link>
            <Link to="/#recursos" className="block text-muted-foreground hover:text-foreground">Recursos</Link>
            <Link to="/#plans" className="block text-muted-foreground hover:text-foreground">Planos</Link>
            <span className="block text-primary font-medium">Funcionalidades</span>
            <div className="flex gap-2 pt-2">
              <Link to="/auth"><Button variant="outline" size="sm" className="flex-1">Entrar</Button></Link>
              <Link to="/signup"><Button size="sm" className="flex-1">Começar</Button></Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
