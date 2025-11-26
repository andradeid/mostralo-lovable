import { useNavigate, useParams } from 'react-router-dom';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleSuccess = () => {
    navigate('/dashboard/products');
  };

  const handleCancel = () => {
    navigate('/dashboard/products');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/products')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Produtos
        </Button>
      </div>

      <ProductForm
        productId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}