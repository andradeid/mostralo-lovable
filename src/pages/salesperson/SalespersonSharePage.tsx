import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SharePageContent } from "@/components/share/SharePageContent";
import { Loader2 } from "lucide-react";

export default function SalespersonSharePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");

  useEffect(() => {
    if (user) {
      loadSalespersonData();
    }
  }, [user]);

  const loadSalespersonData = async () => {
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('referral_code, full_name, phone')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setReferralCode(data.referral_code);
      setSellerName(data.full_name || "");
      setSellerPhone(data.phone || "");
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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
    <SharePageContent
      referralCode={referralCode}
      defaultName={sellerName}
      defaultPhone={sellerPhone}
    />
  );
}
