// Modais da tela de produtos: nova categoria, edição de produto, limpar tudo e
// sincronização de imagens em massa.
import { CategoryForm } from '@/components/admin/CategoryForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { DeleteAllProductsDialog } from '@/components/admin/products/DeleteAllProductsDialog';
import { BulkImageSyncDialog } from '@/components/admin/products/BulkImageSyncDialog';
import type { CategoryData } from '@/hooks/products/productsPageTypes';
import type { ProductActions } from '@/hooks/products/useProductActions';
import type { FetchCategoriesAndProducts } from '@/hooks/products/useProductsCatalog';

interface Props {
  categoryFormOpen: boolean;
  setCategoryFormOpen: (open: boolean) => void;
  showDeleteAllDialog: boolean;
  setShowDeleteAllDialog: (open: boolean) => void;
  showImageSyncDialog: boolean;
  setShowImageSyncDialog: (open: boolean) => void;
  validatedStoreId: string | null;
  storeName: string | null | undefined;
  totalProducts: number;
  categories: CategoryData[];
  actions: ProductActions;
  fetchCategoriesAndProducts: FetchCategoriesAndProducts;
}

export function ProductsDialogs({
  categoryFormOpen,
  setCategoryFormOpen,
  showDeleteAllDialog,
  setShowDeleteAllDialog,
  showImageSyncDialog,
  setShowImageSyncDialog,
  validatedStoreId,
  storeName,
  totalProducts,
  categories,
  actions,
  fetchCategoriesAndProducts,
}: Props) {
  const { showEditForm, editingProductId, handleEditSuccess, handleEditCancel } = actions;

  return (
    <>
      {/* Modal do formulário de categoria */}
      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSuccess={() => {
          setCategoryFormOpen(false);
          fetchCategoriesAndProducts(0, false);
        }}
      />

      {/* Modal do formulário de edição de produto */}
      {showEditForm && editingProductId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <ProductForm
              productId={editingProductId}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

      {/* Modal de exclusão em massa */}
      {validatedStoreId && storeName && (
        <DeleteAllProductsDialog
          open={showDeleteAllDialog}
          onOpenChange={setShowDeleteAllDialog}
          storeId={validatedStoreId}
          storeName={storeName}
          productsCount={totalProducts}
          categoriesCount={categories.filter(c => c.id !== 'uncategorized').length}
          onSuccess={() => fetchCategoriesAndProducts(0, false)}
        />
      )}

      {/* Modal de sincronização de imagens em massa */}
      {validatedStoreId && (
        <BulkImageSyncDialog
          open={showImageSyncDialog}
          onOpenChange={setShowImageSyncDialog}
          storeId={validatedStoreId}
          categories={categories.map(c => ({ id: c.id, name: c.name }))}
          onComplete={() => fetchCategoriesAndProducts(0, false)}
        />
      )}
    </>
  );
}
