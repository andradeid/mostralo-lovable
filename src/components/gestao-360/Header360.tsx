import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, Menu, X, LogIn, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { label: "Pilares", href: "#pilares" },
  { label: "Tecnologia", href: "#tecnologia" },
  { label: "FAQ", href: "#faq" },
];

export function Header360() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const scrollToSection = (href: string) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-lg border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Store className="h-7 w-7 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-white">Mostralo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-slate-300 hover:text-orange-400 transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
            >
              <Link to="/signup">
                <Rocket className="w-4 h-4 mr-2" />
                Começar Grátis
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] bg-slate-950 border-slate-800 p-0"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Store className="h-6 w-6 text-orange-500" />
                    <span className="text-lg font-bold text-white">Mostralo</span>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => scrollToSection(item.href)}
                      className="flex w-full px-4 py-3 text-slate-300 hover:text-orange-400 hover:bg-slate-800/50 rounded-lg transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Mobile Actions */}
                <div className="p-4 border-t border-slate-800 space-y-3">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  >
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Rocket className="w-4 h-4 mr-2" />
                      Começar Grátis
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
