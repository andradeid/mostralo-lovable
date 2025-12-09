import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SharePageContent } from "@/components/share/SharePageContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";

export default function AdminSharePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState("MOSTRALO");
  const [editCode, setEditCode] = useState("MOSTRALO");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_payment_config')
        .select('master_referral_code')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.master_referral_code) {
        setReferralCode(data.master_referral_code);
        setEditCode(data.master_referral_code);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCode = async () => {
    if (!editCode.trim()) {
      toast.error('Digite um código válido');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('subscription_payment_config')
        .update({ master_referral_code: editCode.toUpperCase() })
        .not('id', 'is', null);

      if (error) throw error;

      setReferralCode(editCode.toUpperCase());
      toast.success('Código atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar código');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuração do Código */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Código de Referência
          </CardTitle>
          <CardDescription>
            Defina seu código personalizado para prospecção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="referralCode">Seu Código</Label>
              <Input
                id="referralCode"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                placeholder="Ex: MOSTRALO"
                className="font-mono text-lg uppercase"
              />
            </div>
            <Button 
              onClick={handleSaveCode} 
              disabled={saving || editCode === referralCode}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo de Compartilhamento */}
      <SharePageContent
        referralCode={referralCode}
        defaultName="Mostralo"
        defaultPhone=""
      />
    </div>
  );
}
