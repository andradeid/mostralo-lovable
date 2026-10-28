import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Evento que a tela do app Mostralo Pedidos escuta para abrir a aba Impressora. */
export const APP_OPEN_PRINTER_EVENT = 'mostralo-app-open-printer';

export function MobileAdminNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // No app Mostralo Pedidos não existe painel para voltar: o botão abre a impressora
  if (pathname.startsWith('/app/pedidos')) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => window.dispatchEvent(new Event(APP_OPEN_PRINTER_EVENT))}>
        <Printer className="h-5 w-5" />
        <span className="sr-only">Impressora</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => navigate('/dashboard')}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Voltar ao Dashboard</span>
    </Button>
  );
}
