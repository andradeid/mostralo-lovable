import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileAdminNav() {
  const navigate = useNavigate();

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
