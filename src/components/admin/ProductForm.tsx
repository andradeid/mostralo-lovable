import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { productSchema, productFormDefaults } from './product-form/schema';
import type { ProductFormData } from './product-form/types';
import { useProductFormData } from './product-form/useProductFormData';
import { saveProduct } from './product-form/saveProduct';
import { BasicInfoSection } from './product-form/BasicInfoSection';
import { OfferSection } from './product-form/OfferSection';
import { StockSection } from './product-form/StockSection';
import { VariantsSection } from './product-form/VariantsSection';
import { MainImageSection, GallerySection } from './product-form/ImagesSections';
import { AddonsSection } from './product-form/AddonsSection';
import { UpsellSection } from './product-form/UpsellSection';
import { SettingsSection } from './product-form/SettingsSection';
import { CodeAndCostSection } from './product-form/CodeAndCostSection';
import { useProductCost } from './product-form/useProductCost';
import { useProductFiscal } from '@/hooks/fiscal/useProductFiscal';
import { ProductFiscalSection } from './fiscal/ProductFiscalSection';
import { DUPLICATE_BARCODE_MESSAGE, isDuplicateBarcodeError } from '@/lib/stock/stockEntry';

interface ProductFormProps {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Criar/editar produto. Seções em ./product-form; registro gravado em lib/productPayload. */
export function ProductForm({
  productId,
  onSuccess,
  onCancel
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: productFormDefaults()
  });
  const d = useProductFormData(form, productId);
  const cost = useProductCost(productId);
  const fiscal = useProductFiscal(productId);
  const { toast } = d;

  const onSubmit = async (data: ProductFormData) => {
    if (fiscal.enabled && !fiscal.isValid) {
      toast({ title: 'Confira os dados fiscais', description: Object.values(fiscal.errors)[0], variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const savedId = await saveProduct({
        productId,
        data,
        storeId: d.store.id,
        variants: d.variants,
        selectedAddonCategories: d.selectedAddonCategories,
      });
      if (savedId) {
        try {
          await cost.saveCost(savedId, d.store.id);
        } catch (costError) {
          console.error('Erro ao salvar custo:', costError);
          toast({
            title: 'Atenção',
            description: 'Produto salvo, mas o preço de custo não foi gravado.',
            variant: 'destructive'
          });
        }
        try {
          await fiscal.save(savedId);
        } catch (fiscalError) {
          console.error('Erro ao salvar dados fiscais:', fiscalError);
          toast({ title: 'Atenção', description: 'Produto salvo, mas os dados fiscais não foram gravados.', variant: 'destructive' });
        }
      }
      toast({
        title: 'Sucesso',
        description: productId ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!'
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      const duplicateBarcode = isDuplicateBarcodeError(error);
      if (duplicateBarcode) {
        form.setError('barcode', { message: DUPLICATE_BARCODE_MESSAGE });
      }
      toast({
        title: 'Erro',
        description: duplicateBarcode ? DUPLICATE_BARCODE_MESSAGE : 'Não foi possível salvar o produto.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {productId ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <BasicInfoSection form={form} categories={d.categories} useRichEditor={d.useRichEditor} setUseRichEditor={d.setUseRichEditor} />

            <Separator />

            {/* Sistema de Ofertas */}
            <OfferSection form={form} />

            <Separator />

            {/* Código de barras e custo */}
            <CodeAndCostSection form={form} cost={cost} />

            <Separator />

            {/* Dados fiscais (só com NFC-e/NF-e ligada) */}
            {fiscal.enabled && <><ProductFiscalSection fiscal={fiscal} /><Separator /></>}

            {/* Controle de Estoque */}
            <StockSection form={form} />

            <Separator />

            {/* Opções */}
            <VariantsSection
              variants={d.variants}
              newVariantName={d.newVariantName}
              setNewVariantName={d.setNewVariantName}
              addVariant={d.addVariant}
              removeVariant={d.removeVariant}
              updateVariantPrice={d.updateVariantPrice}
            />

            <Separator />

            {/* Upload de Imagem Principal */}
            <MainImageSection form={form} uploading={d.uploading} handleImageUpload={d.handleImageUpload} />

            <Separator />

            {/* Galeria de Fotos */}
            <GallerySection
              form={form}
              galleryUploading={d.galleryUploading}
              handleGalleryUpload={d.handleGalleryUpload}
              removeGalleryImage={d.removeGalleryImage}
            />

            <Separator />

            {/* Adicionais */}
            {d.addonCategories.length > 0 && (
              <AddonsSection
                addonCategories={d.addonCategories}
                selectedAddonCategories={d.selectedAddonCategories}
                setSelectedAddonCategories={d.setSelectedAddonCategories}
              />
            )}

            <Separator />

            {/* Upsell - Vendas Sugeridas */}
            {productId && d.store?.id && (
              <UpsellSection storeId={d.store.id} productId={productId} />
            )}

            <Separator />

            {/* Configurações */}
            <SettingsSection form={form} />

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || d.uploading || d.galleryUploading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {productId ? 'Atualizar' : 'Criar'} Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
}
