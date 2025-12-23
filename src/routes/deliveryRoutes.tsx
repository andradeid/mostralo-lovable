import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DeliveryDriverLayout } from "@/components/delivery/DeliveryDriverLayout";
import { LazyRoute } from "@/components/LazyRoute";

// Delivery Driver Pages - Lazy loaded
const DeliveryDriverPanel = lazy(() => import("@/pages/DeliveryDriverPanel"));
const DeliveryDriverReports = lazy(() => import("@/pages/DeliveryDriverReports"));
const DeliveryDriverPayments = lazy(() => import("@/pages/DeliveryDriverPayments"));
const DeliveryDriverProfile = lazy(() => import("@/pages/DeliveryDriverProfile"));
const DeliverySettingsPage = lazy(() => import("@/pages/DeliverySettingsPage"));
const SystemUpdatesPage = lazy(() => import("@/pages/SystemUpdatesPage"));

export const deliveryRoutes = (
  <>
    <Route path="/delivery-panel" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><DeliveryDriverPanel /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-reports" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><DeliveryDriverReports /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-payments" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><DeliveryDriverPayments /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-profile" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><DeliveryDriverProfile /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-settings" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><DeliverySettingsPage /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/entregador/novidades" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <LazyRoute><SystemUpdatesPage /></LazyRoute>
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
  </>
);
