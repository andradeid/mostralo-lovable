import { Store } from "lucide-react";
export function DashboardFooter() {
  return <footer className="border-t bg-card/50 py-4 mt-auto">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col justify-center items-center gap-1">
          <a href="https://mostralo.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xs sm:text-sm text-muted-foreground">Feito por:</span>
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-base sm:text-lg font-bold text-primary">Mostralo</span>
          </a>
          <span className="text-[10px] sm:text-sm text-muted-foreground text-center">Todos os direitos reservados 2026 - 30 anos de Tecnologia e Desenvolvimento.</span>
        </div>
      </div>
    </footer>;
}