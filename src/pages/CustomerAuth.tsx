import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function CustomerAuth() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect automático para a loja com parâmetro de autenticação
    if (storeSlug) {
      navigate(`/loja/${storeSlug}?auth=true`, { replace: true });
    }
  }, [storeSlug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
