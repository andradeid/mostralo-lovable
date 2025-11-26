import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PromotionForm } from '@/components/admin/PromotionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PromotionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(!!id);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (stores) {
        setStoreId(stores.id);
      }
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success(id ? 'Promoção atualizada com sucesso!' : 'Promoção criada com sucesso!');
    navigate('/dashboard/promotions');
  };

  const handleCancel = () => {
    navigate('/dashboard/promotions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/promotions')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {id ? 'Editar Promoção' : 'Nova Promoção'}
          </h1>
          <p className="text-muted-foreground">
            {id ? 'Atualize os dados da promoção' : 'Crie uma nova promoção para sua loja'}
          </p>
        </div>
      </div>

      <PromotionForm
        promotionId={id}
        storeId={storeId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
