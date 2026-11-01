import { useState } from 'react';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2 } from 'lucide-react';
import { useAdminCoupons } from '@/hooks/coupons/useAdminCoupons';
import { filterCoupons, getCouponStats } from '@/lib/coupons/adminCoupons';
import { CouponsPageHeader } from '@/components/admin/coupons/page/CouponsPageHeader';
import { CouponsKpiCards } from '@/components/admin/coupons/page/CouponsKpiCards';
import { CouponsFilterBar } from '@/components/admin/coupons/page/CouponsFilterBar';
import { CouponCard } from '@/components/admin/coupons/page/CouponCard';
import { CouponsEmptyState } from '@/components/admin/coupons/page/CouponsEmptyState';
import { CouponFormDialog } from '@/components/admin/coupons/page/CouponFormDialog';

// Tela de cupons do master. Só orquestra: dados e ações em src/hooks/coupons/,
// regras puras em src/lib/coupons/ e telas em src/components/admin/coupons/page/.
const AdminCouponsPage = () => {
  usePageSEO({
    title: 'Cupons - Mostralo | Gerenciar Cupons de Desconto',
    description: 'Gerencie cupons promocionais com limites de uso e rastreamento completo.',
    keywords: 'cupons desconto, promoções, códigos promocionais, gestão cupons'
  });

  const {
    coupons,
    plans,
    loading,
    dialogOpen,
    setDialogOpen,
    selectedCoupon,
    saving,
    formData,
    setFormData,
    handleNew,
    handleEdit,
    handleSave,
    handleDelete,
    copyCode,
    handleDuplicate,
  } = useAdminCoupons();

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDiscountType, setFilterDiscountType] = useState<string>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { activeCoupons, scheduledCoupons, totalUses, conversionRate } = getCouponStats(coupons);

  // Filtros aplicados
  const filteredCoupons = filterCoupons(coupons, filterStatus, filterDiscountType);

  return (
    <div className="space-y-5">
      {/* Header */}
      <CouponsPageHeader onNew={handleNew} />

      {/* KPIs - 4 cards */}
      <CouponsKpiCards
        coupons={coupons}
        activeCoupons={activeCoupons}
        scheduledCoupons={scheduledCoupons}
        totalUses={totalUses}
        conversionRate={conversionRate}
      />

      {/* Filtros rápidos */}
      <CouponsFilterBar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterDiscountType={filterDiscountType}
        setFilterDiscountType={setFilterDiscountType}
        filteredCount={filteredCoupons.length}
        totalCount={coupons.length}
      />

      {/* Coupon Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCoupons.map((coupon) => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            copyCode={copyCode}
            handleEdit={handleEdit}
            handleDuplicate={handleDuplicate}
            handleDelete={handleDelete}
          />
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <CouponsEmptyState coupons={coupons} onNew={handleNew} />
      )}

      {/* Dialog - Responsivo */}
      <CouponFormDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        selectedCoupon={selectedCoupon}
        formData={formData}
        setFormData={setFormData}
        plans={plans}
        saving={saving}
        handleSave={handleSave}
      />
    </div>
  );
};

export default AdminCouponsPage;
