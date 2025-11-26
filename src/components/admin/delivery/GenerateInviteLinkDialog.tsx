import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Loader2, Link as LinkIcon, Calendar, Users } from "lucide-react";

interface GenerateInviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
}

export function GenerateInviteLinkDialog({ 
  open, 
  onOpenChange, 
  storeId 
}: GenerateInviteLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [maxUses, setMaxUses] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-store-invite-link', {
        body: {
          store_id: storeId,
          expires_in_days: expiresInDays,
          max_uses: maxUses
        }
      });

      if (error) throw error;
      
      setGeneratedLink(data.invite_link);
      toast.success('Link de convite gerado com sucesso!');
    } catch (error: any) {
      console.error('Error generating invite link:', error);
      toast.error(error.message || 'Erro ao gerar link de convite');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setExpiresInDays(30);
    setMaxUses(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Gerar Link de Convite Público
          </DialogTitle>
          <DialogDescription>
            Crie um link para que qualquer pessoa possa se cadastrar como entregador da sua loja
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expires" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validade do link (dias)
              </Label>
              <Input
                id="expires"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                min={1}
                max={365}
                placeholder="30"
              />
              <p className="text-sm text-muted-foreground">
                O link expirará após {expiresInDays} dias
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Máximo de cadastros (opcional)
              </Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses || ''}
                onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                placeholder="Ilimitado"
                min={1}
              />
              <p className="text-sm text-muted-foreground">
                {maxUses 
                  ? `O link poderá ser usado até ${maxUses} vezes` 
                  : 'Deixe vazio para permitir cadastros ilimitados'}
              </p>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Gerar Link de Convite
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Link de Convite Gerado</Label>
              <div className="p-4 bg-muted rounded-lg break-all text-sm font-mono">
                {generatedLink}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard} 
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
              <Button 
                onClick={handleClose} 
                variant="outline"
                className="flex-1"
              >
                Fechar
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>✓ Válido por {expiresInDays} dias</p>
              <p>✓ {maxUses ? `Máximo de ${maxUses} usos` : 'Usos ilimitados'}</p>
              <p className="text-xs mt-2">
                Compartilhe este link com potenciais entregadores. Eles poderão se cadastrar diretamente na sua loja.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
